import type { BrowserManager } from '../browser-manager.js';
import { ErrorCodes } from '../types.js';

export async function executeJs(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    script: string;
  }
): Promise<{ result: any }> {
  const { session_id, script } = args;
  const session = browserManager.getSession(session_id);

  try {
    const result = await session.page.evaluate((script) => {
      // eslint-disable-next-line no-eval
      return eval(script);
    }, script);
    return { result };
  } catch (error) {
    const errorMsg = (error as Error).message;

    // Provide helpful suggestions for common errors
    let helpfulHint = '';
    if (errorMsg.includes('not a valid selector') || errorMsg.includes(':contains')) {
      helpfulHint = '\n\nHint: :contains() is not a valid CSS selector. Use JavaScript instead: Array.from(document.querySelectorAll(\'a\')).find(el => el.textContent?.includes(\'text\'))';
    } else if (errorMsg.includes('querySelectorAll') && errorMsg.includes('null')) {
      helpfulHint = '\n\nHint: Element not found. Check if the selector exists on the page, or if you need to wait for dynamic content to load.';
    } else if (errorMsg.includes('JSON') || errorMsg.includes('circular')) {
      helpfulHint = '\n\nHint: Cannot serialize complex objects (DOM elements, functions, circular references). Return plain objects/arrays/strings instead.';
    } else if (errorMsg.includes('undefined') && errorMsg.includes('property')) {
      helpfulHint = '\n\nHint: Use optional chaining (?.) to safely access properties that might be undefined: element?.querySelector(\'.class\')?.textContent';
    }

    throw new Error(`${ErrorCodes.JS_EXECUTION_ERROR}: ${errorMsg}${helpfulHint}`);
  }
}

export async function getHtml(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector?: string;
    outer_html?: boolean;
  }
): Promise<{ html: string }> {
  const { session_id, selector, outer_html = true } = args;
  const session = browserManager.getSession(session_id);

  try {
    let html: string;
    if (selector) {
      const element = await session.page.locator(selector).first();
      html = outer_html
        ? await element.evaluate((el) => el.outerHTML)
        : await element.evaluate((el) => el.innerHTML);
    } else {
      html = await session.page.content();
    }
    return { html };
  } catch (error) {
    throw new Error(`${ErrorCodes.SELECTOR_NOT_FOUND}: ${selector} - ${(error as Error).message}`);
  }
}

export async function getText(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector?: string;
  }
): Promise<{ text: string }> {
  const { session_id, selector } = args;
  const session = browserManager.getSession(session_id);

  try {
    let text: string;
    if (selector) {
      text = await session.page.locator(selector).first().textContent() ?? '';
    } else {
      text = await session.page.locator('body').textContent() ?? '';
    }
    return { text };
  } catch (error) {
    throw new Error(`${ErrorCodes.SELECTOR_NOT_FOUND}: ${selector} - ${(error as Error).message}`);
  }
}

export async function getElementInfo(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector: string;
  }
): Promise<{
  text: string;
  attributes: Record<string, string>;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  isVisible: boolean;
  tagName: string;
}> {
  const { session_id, selector } = args;
  const session = browserManager.getSession(session_id);

  try {
    const element = session.page.locator(selector).first();

    const [text, attributes, boundingBox, isVisible, tagName] = await Promise.all([
      element.textContent().then((t) => t ?? ''),
      element.evaluate((el) => {
        const attrs: Record<string, string> = {};
        for (const attr of el.attributes) {
          attrs[attr.name] = attr.value;
        }
        return attrs;
      }),
      element.boundingBox(),
      element.isVisible(),
      element.evaluate((el) => el.tagName),
    ]);

    return {
      text,
      attributes,
      boundingBox,
      isVisible,
      tagName,
    };
  } catch (error) {
    throw new Error(`${ErrorCodes.SELECTOR_NOT_FOUND}: ${selector} - ${(error as Error).message}`);
  }
}
