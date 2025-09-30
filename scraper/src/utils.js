import fs from 'fs/promises';
import path from 'path';

/**
 * Delay helper
 */
export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Progress tracking
 */
export class ProgressTracker {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      lastListingPage: 0,
      scrapedUrls: [],
      lastDetailIndex: 0,
      scrapedPrograms: 0,
      errors: [],
      startedAt: null,
      lastUpdated: null
    };
  }

  async load() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content);
      console.log('📂 Loaded progress:', this.data);
    } catch (error) {
      console.log('📝 No existing progress found, starting fresh');
    }

    this.data.scrapedUrls = Array.from(new Set(this.data.scrapedUrls || []));
    this.data.errors = this.data.errors || [];
    this.data.lastListingPage = this.data.lastListingPage || 0;
    this.data.lastDetailIndex = this.data.lastDetailIndex || 0;
    this.data.scrapedPrograms = this.data.scrapedPrograms || 0;
  }

  async save() {
    let existing = {};
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      existing = JSON.parse(content);
    } catch (error) {
      // No existing file or invalid JSON – treat as fresh start
    }

    const merged = {
      ...existing,
      ...this.data
    };

    const existingUrls = Array.isArray(existing.scrapedUrls) ? existing.scrapedUrls : [];
    const currentUrls = Array.isArray(this.data.scrapedUrls) ? this.data.scrapedUrls : [];
    merged.scrapedUrls = Array.from(new Set([...existingUrls, ...currentUrls]));

    const existingErrors = Array.isArray(existing.errors) ? existing.errors : [];
    const currentErrors = Array.isArray(this.data.errors) ? this.data.errors : [];
    merged.errors = [...existingErrors, ...currentErrors];

    merged.lastListingPage = Math.max(existing.lastListingPage || 0, this.data.lastListingPage || 0);
    merged.lastDetailIndex = Math.max(existing.lastDetailIndex || 0, this.data.lastDetailIndex || 0);
    merged.scrapedPrograms = Math.max(existing.scrapedPrograms || 0, this.data.scrapedPrograms || 0);

    merged.lastUpdated = new Date().toISOString();

    this.data = merged;

    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  markListingPage(pageNum) {
    this.data.lastListingPage = Math.max(this.data.lastListingPage || 0, pageNum);
  }

  addUrls(urls) {
    const current = new Set(this.data.scrapedUrls || []);
    urls.forEach(url => current.add(url));
    this.data.scrapedUrls = Array.from(current);
  }

  markDetailComplete(index) {
    this.data.lastDetailIndex = Math.max(this.data.lastDetailIndex || 0, index);
    this.data.scrapedPrograms = Math.max((this.data.scrapedPrograms || 0) + 1, this.data.scrapedPrograms || 0);
  }

  addError(error) {
    this.data.errors.push({
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  getStats() {
    return {
      listingPages: this.data.lastListingPage,
      urlsCollected: this.data.scrapedUrls.length,
      programsScraped: this.data.scrapedPrograms,
      errors: this.data.errors.length
    };
  }
}

/**
 * Retry helper
 */
export async function withRetry(fn, maxRetries = 3, delayMs = 5000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        await delay(delayMs * attempt); // Exponential backoff
      }
    }
  }
  throw lastError;
}

/**
 * Format time duration
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Estimate remaining time
 */
export function estimateTimeRemaining(completed, total, elapsedMs) {
  if (completed === 0) return '?';
  const msPerItem = elapsedMs / completed;
  const remaining = total - completed;
  return formatDuration(remaining * msPerItem);
}