import { chromium } from 'playwright';
import { config } from './config.js';
import { delay, ProgressTracker, withRetry, formatDuration, estimateTimeRemaining } from './utils.js';
import { saveProgram, programExists, getScrapedCount } from './db.js';
import fs from 'fs/promises';

/**
 * Scrape detail pages for each program
 *
 * Extracts: metadata, descriptions, contact info
 * Saves directly to Supabase database
 * Estimated time: ~3.5 hours with 5s delays for 2,400 programs
 */

export async function scrapeDetails(urls, options = {}) {
  const {
    startIndex = 0,
    maxPrograms = null,
    dryRun = false,
    onProgress = null,
    skipExisting = true
  } = options;

  console.log('🚀 Starting detail scraper...');
  console.log(`📊 Total programs to scrape: ${urls.length}`);
  console.log(`⏱️  Delay: ${config.delay}ms between requests`);

  const tracker = new ProgressTracker(config.progressFile);
  await tracker.load();

  // Check how many programs already scraped
  const scrapedCount = await getScrapedCount();
  console.log(`💾 Already in database: ${scrapedCount} programs`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: config.userAgent,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const programs = [];
  const startTime = Date.now();
  const endIndex = maxPrograms ? Math.min(startIndex + maxPrograms, urls.length) : urls.length;

  try {
    for (let i = startIndex; i < endIndex; i++) {
      const url = urls[i];
      const progress = i - startIndex + 1;
      const total = endIndex - startIndex;

      console.log(`\n[${progress}/${total}] Scraping: ${url}`);

      // Check if already exists in database
      if (skipExisting && !dryRun) {
        const exists = await programExists(url);
        if (exists) {
          console.log(`  ⏭️  Already in database, skipping...`);
          continue;
        }
      }

      try {
        const programData = await withRetry(async () => {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

          // Extract all data from detail page
          return await page.evaluate(() => {
            // Helper to extract metadata from visible fields
            const getMetadata = () => {
              const result = {};

              // Try to find metadata in the structured format
              const metaLabels = document.querySelectorAll('dt, .card__meta-label');
              metaLabels.forEach(label => {
                const key = label.textContent?.trim().replace(':', '');
                const value = label.nextElementSibling?.textContent?.trim();
                if (key && value) {
                  result[key] = value.includes(',')
                    ? value.split(',').map(v => v.trim())
                    : [value];
                }
              });

              // Fallback: regex matching in body HTML for key fields
              if (Object.keys(result).length === 0) {
                const html = document.body.innerHTML;
                const patterns = {
                  'Förderart': /Förderart:\s*([^\n<]+)/,
                  'Fördergebiet': /Fördergebiet:\s*([^\n<]+)/,
                  'Förderbereich': /Förderbereich:\s*([^\n<]+)/,
                  'Förderberechtigte': /Förderberechtigte:\s*([^\n<]+)/
                };

                Object.entries(patterns).forEach(([key, pattern]) => {
                  const match = html.match(pattern);
                  if (match) {
                    result[key] = match[1].trim().split(',').map(s => s.trim());
                  }
                });
              }

              return result;
            };

            // Helper to extract text sections by heading
            const getSection = (keyword) => {
              const headings = Array.from(document.querySelectorAll('h2, h3, h4, strong'));
              const heading = headings.find(h =>
                h.textContent?.toLowerCase().includes(keyword.toLowerCase())
              );

              if (!heading) return null;

              // Get all text content after this heading until next major heading
              let text = '';
              let current = heading.nextElementSibling;

              while (current && !['H1', 'H2'].includes(current.tagName)) {
                if (current.textContent) {
                  text += current.textContent.trim() + '\n\n';
                }
                current = current.nextElementSibling;

                // Safety: stop after 50 elements to avoid infinite loops
                if (!current || text.length > 50000) break;
              }

              return text.trim() || null;
            };

            // Extract the FULL Richtlinie section (legal text)
            const getRichtlinie = () => {
              // Look for "Richtlinie" heading
              const richtlinieHeading = Array.from(document.querySelectorAll('h2, h3, h4, strong'))
                .find(h => h.textContent?.toLowerCase().includes('richtlinie'));

              if (!richtlinieHeading) return null;

              // Get all content after Richtlinie heading
              let text = '';
              let current = richtlinieHeading.nextElementSibling;

              while (current) {
                if (current.textContent) {
                  text += current.textContent.trim() + '\n\n';
                }
                current = current.nextElementSibling;

                // Stop if we hit another major section or reach 100k chars
                if (text.length > 100000) break;
              }

              return text.trim() || null;
            };

            // Extract contact info
            const getContact = () => {
              const contactSection = document.body.innerHTML.match(
                /Ansprechpunkt:[\s\S]{0,1000}/
              )?.[0];

              if (!contactSection) return null;

              // Extract organization, address, phone, email
              const organization = contactSection.match(/([^<]*(?:GmbH|Ministerium|Bank|Institut|Agentur)[^<]*)/)?.[1]?.trim();
              const email = contactSection.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
              const phone = contactSection.match(/Tel:\s*([^\n<]+)/)?.[1]?.trim();
              const address = contactSection.match(/(\d{5}\s+[^\n<]+)/)?.[1]?.trim();

              return {
                organization: organization || null,
                email: email || null,
                phone: phone || null,
                address: address || null,
                raw: contactSection.replace(/<[^>]*>/g, '').trim()
              };
            };

            const metadata = getMetadata();

            return {
              title: document.querySelector('h1')?.textContent?.trim(),
              url: window.location.href,
              foerderart: metadata['Förderart'] || null,
              foerdergebiet: metadata['Fördergebiet'] || null,
              foerderbereich: metadata['Förderbereich'] || null,
              foerderberechtigte: metadata['Förderberechtigte'] || null,
              foerdergeber: metadata['Fördergeber'] || null,
              kurztext: getSection('kurztext'),
              volltext: getSection('volltext'),
              rechtliche_voraussetzungen: getSection('rechtliche voraussetzungen'),
              richtlinie: getRichtlinie(), // Full legal text
              ansprechpartner: getContact(),
              scraped_at: new Date().toISOString()
            };
          });
        });

        programs.push(programData);

        // Save to Supabase
        if (!dryRun) {
          try {
            const saved = await saveProgram(programData);
            console.log(`  ✅ ${programData.title}`);
            console.log(`  💾 Saved to database (ID: ${saved.id})`);
          } catch (dbError) {
            console.error(`  ⚠️  Database error: ${dbError.message}`);
            // Continue scraping even if database save fails
            tracker.addError({ url, error: `DB Save Failed: ${dbError.message}` });
          }

          tracker.markDetailComplete(i);
          await tracker.save();
        } else {
          console.log(`  ✅ ${programData.title} [DRY RUN]`);
        }

        if (onProgress) {
          await onProgress(programData);
        }

        // Show progress
        const elapsed = Date.now() - startTime;
        const eta = estimateTimeRemaining(progress, total, elapsed);
        console.log(`  ⏱️  Elapsed: ${formatDuration(elapsed)} | ETA: ${eta}`);

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        tracker.addError({ url, error: error.message });
      }

      // Delay between requests
      if (i < endIndex - 1) {
        await delay(config.delay);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await browser.close();
  }

  const elapsed = Date.now() - startTime;
  const finalCount = await getScrapedCount();

  console.log('\n✅ Detail scrape complete!');
  console.log(`📊 Programs scraped: ${programs.length}`);
  console.log(`💾 Total in database: ${finalCount}`);
  console.log(`⏱️  Total time: ${formatDuration(elapsed)}`);

  return programs;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  // Load URLs from progress file
  const tracker = new ProgressTracker(config.progressFile);
  await tracker.load();

  if (!tracker.data.scrapedUrls || tracker.data.scrapedUrls.length === 0) {
    console.error('❌ No URLs found. Run scrape-listings.js first!');
    process.exit(1);
  }

  const options = {
    startIndex: tracker.data.lastDetailIndex || 0,
    maxPrograms: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
    dryRun: args.includes('--dry-run')
  };

  console.log(`📂 Loaded ${tracker.data.scrapedUrls.length} URLs from progress file`);

  scrapeDetails(tracker.data.scrapedUrls, options)
    .then(programs => {
      console.log(`\n💾 Scraped ${programs.length} programs`);
      console.log(`\n📝 Sample program:`);
      if (programs[0]) {
        console.log(JSON.stringify(programs[0], null, 2));
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}