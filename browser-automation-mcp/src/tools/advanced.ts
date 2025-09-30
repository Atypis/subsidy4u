import type { BrowserManager } from '../browser-manager.js';
import { ErrorCodes } from '../types.js';

export async function executeJsOnAllPages(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    script: string;
    next_page_selector: string;
    max_pages?: number;
    wait_between_pages?: number;
  }
): Promise<{ results: Array<{ page: number; data: any }>; total_pages: number }> {
  const {
    session_id,
    script,
    next_page_selector,
    max_pages = 20, // Safer default - prevents timeouts
    wait_between_pages = 1000,
  } = args;
  const session = browserManager.getSession(session_id);

  const results: Array<{ page: number; data: any }> = [];
  let currentPage = 1;

  try {
    while (currentPage <= max_pages) {
      // Execute script on current page
      const data = await session.page.evaluate((script) => {
        // eslint-disable-next-line no-eval
        return eval(script);
      }, script);

      results.push({ page: currentPage, data });

      // Check if there's a next page button
      const nextButton = await session.page.locator(next_page_selector).first();
      const isVisible = await nextButton.isVisible().catch(() => false);

      if (!isVisible) {
        break;
      }

      // Click next page
      await nextButton.click();
      await session.page.waitForLoadState('networkidle');

      // Wait between pages
      if (wait_between_pages > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait_between_pages));
      }

      currentPage++;
    }

    return {
      results,
      total_pages: currentPage,
    };
  } catch (error) {
    throw new Error(`${ErrorCodes.JS_EXECUTION_ERROR}: ${(error as Error).message}`);
  }
}

export async function extractTable(
  browserManager: BrowserManager,
  args: {
    session_id: string;
    selector: string;
    use_first_row_as_headers?: boolean;
  }
): Promise<{ data: Array<Record<string, string>>; row_count: number }> {
  const { session_id, selector, use_first_row_as_headers = true } = args;
  const session = browserManager.getSession(session_id);

  try {
    const data = await session.page.evaluate(
      ({ selector, useHeaders }: { selector: string; useHeaders: boolean }) => {
        const table = document.querySelector(selector);
        if (!table) throw new Error('Table not found');

        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) return [];

        let headers: string[] = [];
        let dataRows: Element[] = rows;

        if (useHeaders && rows.length > 0) {
          const headerRow: Element = rows[0];
          headers = Array.from(headerRow.querySelectorAll('th, td')).map(
            (cell: Element) => cell.textContent?.trim() ?? ''
          );
          dataRows = rows.slice(1);
        } else {
          // Generate generic headers
          const firstRow: Element = rows[0];
          const cellCount = firstRow.querySelectorAll('td').length;
          headers = Array.from({ length: cellCount }, (_, i) => `Column ${i + 1}`);
        }

        return dataRows.map((row: Element) => {
          const cells = Array.from(row.querySelectorAll('td')).map(
            (cell: Element) => cell.textContent?.trim() ?? ''
          );
          const rowData: Record<string, string> = {};
          headers.forEach((header, i) => {
            rowData[header] = cells[i] ?? '';
          });
          return rowData;
        });
      },
      { selector, useHeaders: use_first_row_as_headers }
    );

    return {
      data,
      row_count: data.length,
    };
  } catch (error) {
    throw new Error(`${ErrorCodes.SELECTOR_NOT_FOUND}: ${selector} - ${(error as Error).message}`);
  }
}
