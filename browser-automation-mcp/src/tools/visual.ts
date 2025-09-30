import type { BrowserManager } from '../browser-manager.js';

export async function takeScreenshot(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector?: string;
    full_page?: boolean;
    format?: 'png' | 'jpeg';
    path?: string;
  }
): Promise<{ base64?: string; path?: string }> {
  const { session_id, selector, full_page = false, format = 'png', path } = args;
  const session = browserManager.getSession(session_id);

  try {
    let screenshot: Buffer;

    if (selector) {
      const element = session.page.locator(selector).first();
      screenshot = await element.screenshot({ type: format });
    } else {
      screenshot = await session.page.screenshot({
        fullPage: full_page,
        type: format,
        path,
      });
    }

    return {
      base64: path ? undefined : screenshot.toString('base64'),
      path,
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
