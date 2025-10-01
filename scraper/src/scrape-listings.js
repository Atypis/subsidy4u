import { chromium } from 'playwright';
import { config } from './config.js';
import { delay, withRetry, formatDuration } from './utils.js';
import fs from 'fs/promises';

/**
 * Memory-efficient listing scraper
 * Appends URLs to file instead of loading all into memory
 */

let gracefulShutdown = false;
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Graceful shutdown initiated...');
  gracefulShutdown = true;
});

async function readProgress() {
  try {
    const content = await fs.readFile(config.progressFile, 'utf-8');
    const data = JSON.parse(content);
    return {
      lastPage: data.lastListingPage || 0,
      urlCount: Array.isArray(data.scrapedUrls) ? data.scrapedUrls.length : 0
    };
  } catch (error) {
    return { lastPage: 0, urlCount: 0 };
  }
}

async function savePageProgress(pageNum, urls) {
  try {
    const content = await fs.readFile(config.progressFile, 'utf-8');
    const data = JSON.parse(content);

    // Add new URLs
    const existing = new Set(data.scrapedUrls || []);
    urls.forEach(url => existing.add(url));
    data.scrapedUrls = Array.from(existing);

    // Update page
    data.lastListingPage = Math.max(data.lastListingPage || 0, pageNum);
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(config.progressFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving progress:', error.message);
  }
}

async function main() {
  const startTime = Date.now();
  const progress = await readProgress();
  const startPage = progress.lastPage + 1;

  console.log('🚀 Starting listing scraper v2 (memory-efficient)...');
  console.log(`📄 Resuming from page ${startPage}`);
  console.log(`📊 Current URL count: ${progress.urlCount}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: config.userAgent,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Get total pages
    const searchUrl = new URL(config.searchUrl);
    Object.entries(config.searchParams).forEach(([key, value]) => {
      searchUrl.searchParams.set(key, value);
    });

    await page.goto(searchUrl.toString(), { waitUntil: 'networkidle', timeout: 30000 });
    const totalPages = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.pagination a'));
      const numbers = links.map(a => parseInt(a.textContent?.trim())).filter(n => !isNaN(n));
      return numbers.length ? Math.max(...numbers) : 245;
    });

    console.log(`📊 Total pages: ${totalPages}`);

    // Navigate to start page if needed
    if (startPage > 1) {
      const directUrl = new URL(config.searchUrl);
      Object.entries(config.searchParams).forEach(([key, value]) => {
        directUrl.searchParams.set(key, value);
      });
      directUrl.searchParams.set('gtp', `%2526816beae2-d57e-4bdc-b55d-392bc1e17027_list%253D${startPage}`);
      await page.goto(directUrl.toString(), { waitUntil: 'networkidle', timeout: 30000 });
    }

    let currentPage = startPage;
    let processedPages = 0;

    while (currentPage <= totalPages) {
      if (gracefulShutdown) {
        console.log('✅ Graceful shutdown complete.');
        break;
      }

      console.log(`\n📄 Page ${currentPage}/${totalPages}`);

      try {
        const programs = await page.evaluate((selector) => {
          return Array.from(document.querySelectorAll(selector)).map(card => {
            const links = card.querySelectorAll('a');
            const mainLink = Array.from(links).find(a => a.href && a.href.includes('/Content/'));
            return mainLink?.href;
          }).filter(Boolean);
        }, config.selectors.programCard);

        console.log(`  ✅ Found ${programs.length} programs`);

        if (programs.length > 0) {
          await savePageProgress(currentPage, programs);
          const newProgress = await readProgress();
          console.log(`  💾 Saved (total: ${newProgress.urlCount} URLs)`);
        }

        processedPages++;

        const elapsed = Date.now() - startTime;
        const avgTime = elapsed / processedPages;
        const remaining = (totalPages - currentPage) * avgTime;
        console.log(`  ⏱️  ETA: ${formatDuration(remaining)}`);

      } catch (error) {
        console.error(`  ❌ Error on page ${currentPage}:`, error.message);
      }

      if (currentPage >= totalPages) break;

      const hasNext = await page.evaluate((selector) => {
        const btn = document.querySelector(selector);
        return btn && btn.offsetParent !== null;
      }, config.selectors.nextButton);

      if (!hasNext) {
        console.log('  ℹ️  No next button. Done.');
        break;
      }

      await delay(config.delay);
      await withRetry(async () => {
        await page.click(config.selectors.nextButton);
        await page.waitForLoadState('networkidle', { timeout: 30000 });
      }, 3, config.delay);

      currentPage++;
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }

  const finalProgress = await readProgress();
  console.log('\n✅ Scraping complete!');
  console.log(`📊 Total URLs: ${finalProgress.urlCount}`);
  console.log(`📄 Last page: ${finalProgress.lastPage}`);
  console.log(`⏱️  Time: ${formatDuration(Date.now() - startTime)}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
  });