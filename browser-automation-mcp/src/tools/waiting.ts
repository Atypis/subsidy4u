import type { BrowserManager } from '../browser-manager.js';
import type { WaitForCondition } from '../types.js';
import { ErrorCodes } from '../types.js';

export async function waitFor(
  browserManager: BrowserManager,
  args: WaitForCondition & { session_id: string }
): Promise<{ success: boolean }> {
  const { session_id, condition, target, timeout = 30000 } = args;
  const session = browserManager.getSession(session_id);

  try {
    switch (condition) {
      case 'selector':
        if (!target) {
          throw new Error(`${ErrorCodes.INVALID_PARAMETER}: target required for selector condition`);
        }
        await session.page.waitForSelector(target, { timeout });
        break;

      case 'navigation':
        await session.page.waitForLoadState('load', { timeout });
        break;

      case 'network_idle':
        await session.page.waitForLoadState('networkidle', { timeout });
        break;

      case 'timeout':
        await new Promise((resolve) => setTimeout(resolve, timeout));
        break;

      default:
        throw new Error(`${ErrorCodes.INVALID_PARAMETER}: unknown condition ${condition}`);
    }

    return { success: true };
  } catch (error) {
    throw new Error(`${ErrorCodes.TIMEOUT}: ${(error as Error).message}`);
  }
}
