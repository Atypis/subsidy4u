import type { BrowserManager } from '../browser-manager.js';
import { ErrorCodes } from '../types.js';

export async function click(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector: string;
    wait_for_selector?: boolean;
    timeout?: number;
  }
): Promise<{ success: boolean }> {
  const { session_id, selector, wait_for_selector = true, timeout = 30000 } = args;
  const session = browserManager.getSession(session_id);

  try {
    if (wait_for_selector) {
      await session.page.waitForSelector(selector, { timeout });
    }
    await session.page.click(selector);
    return { success: true };
  } catch (error) {
    throw new Error(`${ErrorCodes.SELECTOR_NOT_FOUND}: ${selector} - ${(error as Error).message}`);
  }
}

export async function typeText(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector: string;
    text: string;
    clear_first?: boolean;
    delay?: number;
  }
): Promise<{ success: boolean }> {
  const { session_id, selector, text, clear_first = true, delay = 0 } = args;
  const session = browserManager.getSession(session_id);

  try {
    await session.page.waitForSelector(selector);
    if (clear_first) {
      await session.page.fill(selector, '');
    }
    await session.page.type(selector, text, { delay });
    return { success: true };
  } catch (error) {
    throw new Error(`${ErrorCodes.SELECTOR_NOT_FOUND}: ${selector} - ${(error as Error).message}`);
  }
}

export async function scroll(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    direction?: 'down' | 'up' | 'to_element' | 'to_bottom';
    selector?: string;
    pixels?: number;
  }
): Promise<{ success: boolean; scrollY?: number }> {
  const { session_id, direction = 'down', selector, pixels } = args;
  const session = browserManager.getSession(session_id);

  try {
    if (direction === 'to_element') {
      if (!selector) {
        throw new Error(`${ErrorCodes.INVALID_PARAMETER}: selector required for to_element`);
      }
      await session.page.locator(selector).scrollIntoViewIfNeeded();
    } else if (direction === 'to_bottom') {
      await session.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else {
      const scrollAmount = pixels ?? 500;
      const delta = direction === 'down' ? scrollAmount : -scrollAmount;
      await session.page.evaluate((delta) => window.scrollBy(0, delta), delta);
    }

    const scrollY = await session.page.evaluate(() => window.scrollY);
    return { success: true, scrollY };
  } catch (error) {
    throw new Error(`Scroll failed: ${(error as Error).message}`);
  }
}
