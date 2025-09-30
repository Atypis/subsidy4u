import type { BrowserManager } from '../browser-manager.js';
import { ErrorCodes } from '../types.js';

export async function navigate(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    url: string;
    wait_until?: 'load' | 'domcontentloaded' | 'networkidle';
  }
): Promise<{ url: string; title: string; status: number | null }> {
  const { session_id, url, wait_until = 'load' } = args;
  const session = browserManager.getSession(session_id);

  try {
    const response = await session.page.goto(url, { waitUntil: wait_until });
    const title = await session.page.title();

    return {
      url: session.page.url(),
      title,
      status: response?.status() ?? null,
    };
  } catch (error) {
    throw new Error(`${ErrorCodes.NAVIGATION_FAILED}: ${(error as Error).message}`);
  }
}

export async function goBack(
  browserManager: BrowserManager,
  args: { session_id: string }
): Promise<{ url: string }> {
  const session = browserManager.getSession(args.session_id);
  await session.page.goBack();
  return { url: session.page.url() };
}

export async function reload(
  browserManager: BrowserManager,
  args: { session_id: string; ignore_cache?: boolean }
): Promise<{ url: string }> {
  const { session_id, ignore_cache = false } = args;
  const session = browserManager.getSession(session_id);
  
  if (ignore_cache) {
    await session.page.reload({ waitUntil: 'load' });
  } else {
    await session.page.reload();
  }
  
  return { url: session.page.url() };
}
