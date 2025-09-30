import type { BrowserManager } from '../browser-manager.js';

export async function takeScreenshot(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector?: string;
    full_page?: boolean;
    format?: 'png' | 'jpeg';
    path?: string;
    quality?: number;
  }
): Promise<{ base64?: string; path?: string; size?: number; warning?: string }> {
  const { session_id, selector, full_page = false, format = 'png', path, quality } = args;
  const session = browserManager.getSession(session_id);

  try {
    let screenshot: Buffer;
    const screenshotOptions: any = {
      type: format,
    };

    // Add quality for JPEG to reduce size
    if (format === 'jpeg' && quality !== undefined) {
      screenshotOptions.quality = quality;
    }

    if (selector) {
      const element = session.page.locator(selector).first();
      screenshot = await element.screenshot(screenshotOptions);
    } else {
      if (path) {
        screenshotOptions.path = path;
      }
      screenshotOptions.fullPage = full_page;
      screenshot = await session.page.screenshot(screenshotOptions);
    }

    const sizeInKB = screenshot.length / 1024;
    const MAX_SIZE_KB = 500; // 500KB threshold for base64 warning

    // If no path specified, return base64, but warn if too large
    if (!path) {
      if (sizeInKB > MAX_SIZE_KB) {
        return {
          base64: undefined,
          size: Math.round(sizeInKB),
          warning: `Screenshot too large (${Math.round(sizeInKB)}KB) to return as base64. Please specify a 'path' parameter to save to file instead, or use format='jpeg' with quality=60 to reduce size.`,
        };
      }
      return {
        base64: screenshot.toString('base64'),
        size: Math.round(sizeInKB),
      };
    }

    // If path is specified, screenshot is already saved by Playwright
    return {
      path,
      size: Math.round(sizeInKB),
    };
  } catch (error) {
    throw new Error(`Screenshot failed: ${(error as Error).message}`);
  }
}

export async function getViewportInfo(
  browserManager: BrowserManager,
  args: { session_id: string }
): Promise<{
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  scrollHeight: number;
}> {
  const session = browserManager.getSession(args.session_id);

  const info = await session.page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
  }));

  return info;
}
