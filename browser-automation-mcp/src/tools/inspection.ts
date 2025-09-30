import type { BrowserManager } from '../browser-manager.js';
import type { FindElementsQuery } from '../types.js';

export async function getSelectorForPoint(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    x: number;
    y: number;
  }
): Promise<{
  selector: string;
  element_info: { tagName: string; text: string };
}> {
  const { session_id, x, y } = args;
  const session = browserManager.getSession(session_id);

  const result = await session.page.evaluate(
    ({ x, y }: { x: number; y: number }) => {
      const element = document.elementFromPoint(x, y);
      if (!element) return null;

      // Generate a simple selector
      const tagName = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';
      const classes = element.className
        ? `.${element.className.split(' ').join('.')}`
        : '';
      
      const selector = `${tagName}${id}${classes}`;
      
      return {
        selector,
        tagName: element.tagName,
        text: element.textContent?.trim() ?? '',
      };
    },
    { x, y }
  );

  if (!result) {
    throw new Error('No element found at coordinates');
  }

  return {
    selector: result.selector,
    element_info: {
      tagName: result.tagName,
      text: result.text,
    },
  };
}

export async function findElements(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    query: FindElementsQuery;
    limit?: number;
  }
): Promise<{
  elements: Array<{
    selector: string;
    text: string;
    attributes: Record<string, string>;
  }>;
}> {
  const { session_id, query, limit = 10 } = args;
  const session = browserManager.getSession(session_id);

  const result = await session.page.evaluate(
    ({ query, limit }: { query: any; limit: number }) => {
      const elements = Array.from(document.querySelectorAll('*'));
      const matches: Array<{
        selector: string;
        text: string;
        attributes: Record<string, string>;
      }> = [];

      for (const el of elements) {
        if (matches.length >= limit) break;

        let isMatch = true;

        // Check text content
        if (query.text) {
          const textContent = el.textContent?.toLowerCase() ?? '';
          if (!textContent.includes(query.text.toLowerCase())) {
            isMatch = false;
          }
        }

        // Check role
        if (query.role && isMatch) {
          const role = el.getAttribute('role');
          if (role !== query.role) {
            isMatch = false;
          }
        }

        // Check attributes
        if (query.attributes && isMatch) {
          for (const [key, value] of Object.entries(query.attributes)) {
            const attrValue = el.getAttribute(key);
            if (attrValue !== value) {
              isMatch = false;
              break;
            }
          }
        }

        if (isMatch) {
          const tagName = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const classes = el.className
            ? `.${el.className.split(' ').filter(Boolean).join('.')}`
            : '';
          
          const attrs: Record<string, string> = {};
          for (const attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }

          matches.push({
            selector: `${tagName}${id}${classes}`,
            text: el.textContent?.trim().substring(0, 100) ?? '',
            attributes: attrs,
          });
        }
      }

      return matches;
    },
    { query, limit }
  );

  return { elements: result };
}
