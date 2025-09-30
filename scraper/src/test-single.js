import { chromium } from 'playwright';
import { config } from './config.js';

/**
 * Test scraper on a single program
 * Quick validation before running full scrape
 */

const TEST_URL = 'https://www.foerderdatenbank.de/FDB/Content/DE/Foerderprogramm/Land/Sachsen/buergschaft-sachsen-beteiligung.html';

async function testSingleProgram() {
  console.log('🧪 Testing scraper on single program...');
  console.log(`🔗 URL: ${TEST_URL}\n`);

  const browser = await chromium.launch({ headless: false }); // headless: false to see it work
  const context = await browser.newContext({
    userAgent: config.userAgent,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📥 Loading page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Page loaded\n');

    console.log('🔍 Extracting data...');
    const programData = await page.evaluate(() => {
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
        kurztext: getSection('kurztext'),
        volltext: getSection('volltext'),
        rechtliche_voraussetzungen: getSection('rechtliche voraussetzungen'),
        richtlinie: getRichtlinie(),
        ansprechpartner: getContact(),
        scraped_at: new Date().toISOString()
      };
    });

    console.log('✅ Data extracted!\n');

    // Print results
    console.log('═══════════════════════════════════════════');
    console.log('📋 EXTRACTED DATA:');
    console.log('═══════════════════════════════════════════\n');

    console.log(`📌 Title: ${programData.title}`);
    console.log(`🔗 URL: ${programData.url}\n`);

    console.log('🏷️  Metadata:');
    console.log(`  • Förderart: ${programData.foerderart?.join(', ') || 'N/A'}`);
    console.log(`  • Fördergebiet: ${programData.foerdergebiet?.join(', ') || 'N/A'}`);
    console.log(`  • Förderbereich: ${programData.foerderbereich?.join(', ') || 'N/A'}`);
    console.log(`  • Förderberechtigte: ${programData.foerderberechtigte?.join(', ') || 'N/A'}\n`);

    console.log(`📝 Kurztext: ${programData.kurztext ? `${programData.kurztext.substring(0, 100)}...` : 'N/A'}`);
    console.log(`📄 Volltext: ${programData.volltext ? `${programData.volltext.substring(0, 100)}...` : 'N/A'}`);
    console.log(`⚖️  Rechtliche Voraussetzungen: ${programData.rechtliche_voraussetzungen ? `${programData.rechtliche_voraussetzungen.substring(0, 100)}...` : 'N/A'}`);
    console.log(`📜 Richtlinie: ${programData.richtlinie ? `${programData.richtlinie.length} chars` : 'N/A'}\n`);

    console.log('📞 Contact:');
    if (programData.ansprechpartner) {
      console.log(`  • Organization: ${programData.ansprechpartner.organization || 'N/A'}`);
      console.log(`  • Email: ${programData.ansprechpartner.email || 'N/A'}`);
      console.log(`  • Phone: ${programData.ansprechpartner.phone || 'N/A'}`);
      console.log(`  • Address: ${programData.ansprechpartner.address || 'N/A'}`);
    } else {
      console.log('  N/A');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('📊 DATA QUALITY CHECK:');
    console.log('═══════════════════════════════════════════\n');

    const checks = {
      '✅ Title': !!programData.title,
      '✅ Förderart': !!programData.foerderart?.length,
      '✅ Fördergebiet': !!programData.foerdergebiet?.length,
      '✅ Kurztext': !!programData.kurztext,
      '✅ Volltext': !!programData.volltext,
      '✅ Rechtliche Voraussetzungen': !!programData.rechtliche_voraussetzungen,
      '✅ Richtlinie': !!programData.richtlinie && programData.richtlinie.length > 100,
      '✅ Contact': !!programData.ansprechpartner?.organization,
    };

    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key.substring(2)}`);
    });

    const successRate = Object.values(checks).filter(Boolean).length / Object.values(checks).length * 100;
    console.log(`\n🎯 Success Rate: ${successRate.toFixed(0)}%`);

    if (successRate < 70) {
      console.log('\n⚠️  WARNING: Success rate is low. Check the extraction logic!');
    } else {
      console.log('\n✅ Looks good! Ready to scrape all programs.');
    }

    // Save to file for inspection
    const fs = await import('fs/promises');
    await fs.writeFile(
      './test-output.json',
      JSON.stringify(programData, null, 2)
    );
    console.log('\n💾 Full output saved to: ./test-output.json');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testSingleProgram()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });