import { chromium } from 'playwright';
import { config } from './config.js';
import { delay, ProgressTracker, withRetry, formatDuration } from './utils.js';

/**
 * Scrape all listing pages to collect program URLs
 *
 * This script extracts URLs from search result pages.
 * estimated time: ~20 minutes with 5s delays
 */

export async function scrapeListings(options = {}) {
  const {
    maxPages = null,  // null = all pages
    startPage = null,  // null = auto-resume from progress
    dryRun = false
  } = options;

  const tracker = new ProgressTracker(config.progressFile);
  await tracker.load();

  // Auto-resume from last saved page, or start from page 1
  const resumePage = startPage !== null ? startPage : (tracker.data.lastListingPage || 0) + 1;

  console.log('🚀 Starting listing scraper...');
  console.log(`⏱️  Delay: ${config.delay}ms between requests`);
  console.log(`📄 ${resumePage > 1 ? `Resuming from page ${resumePage}` : 'Starting from page 1'}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: config.userAgent,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const allUrls = new Set(tracker.data.scrapedUrls || []);
  const startTime = Date.now();

  try {
    // Always navigate to the first page to establish pagination information
    const searchUrl = new URL(config.searchUrl);
    Object.entries(config.searchParams).forEach(([key, value]) => {
      searchUrl.searchParams.set(key, value);
    });

    console.log(`🌐 Navigating to: ${searchUrl.toString()}`);
    await page.goto(searchUrl.toString(), { waitUntil: 'networkidle', timeout: config.timeout });

    const paginationInfo = await page.evaluate(() => {
      const pageLinks = Array.from(document.querySelectorAll('.c-pagination a, .pagination a'));
      const pageNumbers = pageLinks
        .map(a => parseInt(a.textContent?.trim()))
        .filter(n => !isNaN(n));

      return {
        maxPage: pageNumbers.length ? Math.max(...pageNumbers) : 1,
        hasNext: !!document.querySelector('a.forward.button, a[href*="weiter"]')
      };
    });

    const totalPages = maxPages ? Math.min(maxPages, paginationInfo.maxPage) : paginationInfo.maxPage;
    console.log(`📊 Total pages reported: ${totalPages}`);

    const lastCompletedPage = tracker.data.lastListingPage || 0;
    const desiredStartPage = startPage !== null ? startPage : lastCompletedPage + 1;
    const startPageClamped = Math.min(Math.max(desiredStartPage, 1), totalPages);

    if (startPageClamped > totalPages) {
      console.log('ℹ️  All listing pages already processed.');
      return Array.from(allUrls);
    }

    let currentPage = 1;

    if (startPageClamped > 1) {
      console.log(`⏭️  Fast-forwarding to page ${startPageClamped}...`);
      while (currentPage < startPageClamped) {
        const nextDelay = Math.min(config.delay, 1500);
        await delay(nextDelay);

        await withRetry(async () => {
          await page.click(config.selectors.nextButton);
          await page.waitForLoadState('networkidle', { timeout: config.timeout });
        }, config.maxRetries, config.delay);

        currentPage++;
      }
      console.log(`✅ Resumed at page ${currentPage}`);
    }

    let processedThisRun = 0;

    while (currentPage <= totalPages) {
      console.log(`\n📄 Page ${currentPage}/${totalPages}`);

      const programs = await page.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector)).map(card => {
          const links = card.querySelectorAll('a');
          const mainLink = Array.from(links).find(a =>
            a.href && a.href.includes('/Content/')
          );

          return {
            title: card.querySelector('h2, h3')?.textContent?.trim(),
            url: mainLink?.href,
            basketId: card.querySelector('[data-basket-id]')?.getAttribute('data-basket-id')
          };
        }).filter(p => p.url);
      }, config.selectors.programCard);

      console.log(`  ✅ Found ${programs.length} programs`);

      programs.forEach(p => allUrls.add(p.url));

      if (!dryRun) {
        tracker.addUrls(programs.map(p => p.url));
        tracker.markListingPage(currentPage);
        await tracker.save();
      }

      processedThisRun++;

      if (currentPage >= totalPages) {
        break;
      }

      const hasNext = await page.evaluate((selector) => {
        const nextBtn = document.querySelector(selector);
        return nextBtn && nextBtn.offsetParent !== null;
      }, config.selectors.nextButton);

      if (!hasNext) {
        console.log('  ℹ️  No next page button found. Stopping.');
        break;
      }

      console.log(`  ⏳ Waiting ${config.delay}ms before next page...`);
      await delay(config.delay);

      await withRetry(async () => {
        await page.click(config.selectors.nextButton);
        await page.waitForLoadState('networkidle', { timeout: config.timeout });
      }, config.maxRetries, config.delay);

      currentPage++;

      const elapsed = Date.now() - startTime;
      const averagePageTime = elapsed / Math.max(processedThisRun, 1);
      const remainingPages = totalPages - currentPage + 1;
      const estimatedRemaining = remainingPages * averagePageTime;

      console.log(`  ⏱️  Elapsed: ${formatDuration(elapsed)} | Est. remaining: ${formatDuration(estimatedRemaining)}`);
      console.log(`  📊 Total URLs collected: ${allUrls.size}`);
    }

  } catch (error) {
    console.error('❌ Error during scraping:', error);
    tracker.addError(error);
    await tracker.save();
    throw error;
  } finally {
    await browser.close();
  }

  const elapsed = Date.now() - startTime;
  console.log('\n✅ Listing scrape complete!');
  console.log(`📊 Total URLs collected: ${allUrls.size}`);
  console.log(`⏱️  Total time: ${formatDuration(elapsed)}`);

  if (!dryRun) {
    console.log(`💾 Progress saved to: ${config.progressFile}`);
  }

  return Array.from(allUrls);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    maxPages: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
    dryRun: args.includes('--dry-run')
  };

  scrapeListings(options)
    .then(urls => {
      console.log(`\n📝 Sample URLs:`);
      urls.slice(0, 5).forEach(url => console.log(`  - ${url}`));
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}