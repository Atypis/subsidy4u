import type { BrowserManager } from '../browser-manager.js';
import type { Cookie } from 'playwright';

export async function getCookies(
  browserManager: BrowserManager,
  args: { session_id: string }
): Promise<{ cookies: Cookie[] }> {
  const session = browserManager.getSession(args.session_id);
  const cookies = await session.context.cookies();
  return { cookies };
}

export async function setCookies(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    cookies: Cookie[];
  }
): Promise<{ success: boolean }> {
  const { session_id, cookies } = args;
  const session = browserManager.getSession(session_id);
  await session.context.addCookies(cookies);
  return { success: true };
}

export async function getLocalStorage(
  browserManager: BrowserManager,
  args: { session_id: string }
): Promise<{ data: Record<string, string> }> {
  const session = browserManager.getSession(args.session_id);

  const data = await session.page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items[key] = localStorage.getItem(key) ?? '';
      }
    }
    return items;
  });

  return { data };
}
