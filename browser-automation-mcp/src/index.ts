#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser-manager.js';
import { navigate, goBack, reload } from './tools/navigation.js';
import { click, typeText, scroll } from './tools/interaction.js';
import { executeJs, getHtml, getText, getElementInfo } from './tools/extraction.js';
import { getSelectorForPoint, findElements } from './tools/inspection.js';
import { takeScreenshot, getViewportInfo } from './tools/visual.js';
import { waitFor } from './tools/waiting.js';
import { getCookies, setCookies, getLocalStorage } from './tools/state.js';
import { executeJsOnAllPages, extractTable } from './tools/advanced.js';

const browserManager = new BrowserManager();

const server = new Server(
  {
    name: 'browser-automation-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: 'create_browser_session',
    description: 'Create a new browser session with configurable options',
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', default: true },
        viewport: {
          type: 'object',
          properties: {
            width: { type: 'number', default: 1280 },
            height: { type: 'number', default: 720 },
          },
        },
        userAgent: { type: 'string' },
        browser: {
          type: 'string',
          enum: ['chromium', 'firefox', 'webkit'],
          default: 'chromium',
        },
      },
    },
  },
  {
    name: 'close_browser_session',
    description: 'Close an active browser session',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        url: { type: 'string' },
        wait_until: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          default: 'load',
        },
      },
      required: ['session_id', 'url'],
    },
  },
  {
    name: 'go_back',
    description: 'Navigate back in history',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'reload',
    description: 'Reload current page',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        ignore_cache: { type: 'boolean', default: false },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'click',
    description: 'Click an element',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string' },
        wait_for_selector: { type: 'boolean', default: true },
        timeout: { type: 'number', default: 30000 },
      },
      required: ['session_id', 'selector'],
    },
  },
  {
    name: 'type_text',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string' },
        text: { type: 'string' },
        clear_first: { type: 'boolean', default: true },
        delay: { type: 'number', default: 0 },
      },
      required: ['session_id', 'selector', 'text'],
    },
  },
  {
    name: 'scroll',
    description: 'Scroll page or to specific element',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        direction: {
          type: 'string',
          enum: ['down', 'up', 'to_element', 'to_bottom'],
          default: 'down',
        },
        selector: { type: 'string' },
        pixels: { type: 'number' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'execute_js',
    description: 'Execute JavaScript in page context for targeted data extraction. BEST PRACTICE: Extract specific data with selectors (e.g., querySelectorAll) rather than returning full HTML. Limit results to <1000 items per call. Example: Array.from(document.querySelectorAll(".item")).slice(0, 50).map(el => ({title: el.textContent}))',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        script: { type: 'string', description: 'JavaScript code to execute. Return small, structured data.' },
      },
      required: ['session_id', 'script'],
    },
  },
  {
    name: 'get_html',
    description: 'Get raw HTML of specific element. WARNING: Always provide a selector to limit scope. Never call without selector on complex pages - will truncate at 100KB. For data extraction, prefer execute_js with targeted selectors instead.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector for specific element. REQUIRED for large pages.' },
        outer_html: { type: 'boolean', default: true },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'get_text',
    description: 'Get visible text content. Provide a selector to limit scope. Returns up to 50KB of text (truncated if larger). For structured extraction, use execute_js instead.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector to limit text extraction. Recommended for large pages.' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'get_element_info',
    description: 'Get detailed information about an element',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string' },
      },
      required: ['session_id', 'selector'],
    },
  },
  {
    name: 'get_selector_for_point',
    description: 'Get CSS selector for element at specific coordinates (hit-test)',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
      required: ['session_id', 'x', 'y'],
    },
  },
  {
    name: 'find_elements',
    description: 'Find elements matching criteria (text, attributes, role)',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        query: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            role: { type: 'string' },
            attributes: { type: 'object' },
          },
        },
        limit: { type: 'number', default: 10 },
      },
      required: ['session_id', 'query'],
    },
  },
  {
    name: 'take_screenshot',
    description: 'Capture screenshot of page or element. For large screenshots, use path parameter to save to file, or use format="jpeg" with quality=60 to reduce size.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector to screenshot specific element' },
        full_page: { type: 'boolean', default: false, description: 'Capture full scrollable page (can be very large)' },
        format: { type: 'string', enum: ['png', 'jpeg'], default: 'png', description: 'Image format. Use JPEG for smaller file size.' },
        path: { type: 'string', description: 'File path to save screenshot. RECOMMENDED for large images to avoid base64 overhead.' },
        quality: { type: 'number', description: 'JPEG quality (0-100). Lower = smaller file. Recommended: 60-80. Only works with format="jpeg".' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'get_viewport_info',
    description: 'Get current viewport dimensions and scroll position',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'wait_for',
    description: 'Wait for specific condition before continuing',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        condition: {
          type: 'string',
          enum: ['selector', 'navigation', 'network_idle', 'timeout'],
        },
        target: { type: 'string' },
        timeout: { type: 'number', default: 30000 },
      },
      required: ['session_id', 'condition'],
    },
  },
  {
    name: 'get_cookies',
    description: 'Get all cookies for current page',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'set_cookies',
    description: 'Set cookies before navigation',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        cookies: { type: 'array' },
      },
      required: ['session_id', 'cookies'],
    },
  },
  {
    name: 'get_local_storage',
    description: 'Get localStorage data from current page',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'enable_request_interception',
    description: 'Start intercepting network requests. MUST be called BEFORE navigate. Use to discover hidden APIs. Recommended pattern: ".*api.*" or ".*xhr.*" to catch API calls.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        url_pattern: { type: 'string', description: 'Regex pattern. Common: ".*api.*", ".*xhr.*", or ".*" for all', default: '.*api.*' },
      },
      required: ['session_id', 'url_pattern'],
    },
  },
  {
    name: 'get_network_requests',
    description: 'Get intercepted network requests. Check resource_type="xhr" or "fetch" to find API endpoints. Use include_response_body: true to see API responses. This often reveals easier ways to get data than HTML scraping.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        filter: {
          type: 'object',
          properties: {
            url_pattern: { type: 'string', description: 'Regex to filter URLs' },
            method: { type: 'string', description: 'GET, POST, etc.' },
            resource_type: { type: 'string', description: 'Common: "xhr", "fetch", "document"' },
          },
        },
        include_response_body: { type: 'boolean', default: false, description: 'Set true to see API responses' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'execute_js_on_all_pages',
    description: 'Auto-paginate through results, executing JS on each page. Returns array of results per page. RECOMMENDED for scraping paginated data. Keep max_pages reasonable (10-50) to avoid timeouts.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        script: { type: 'string', description: 'JS to run on each page. Return array of items.' },
        next_page_selector: { type: 'string', description: 'CSS selector for next page button/link' },
        max_pages: { type: 'number', default: 20, description: 'Limit to prevent timeouts. Default 20.' },
        wait_between_pages: { type: 'number', default: 1000, description: 'Delay in ms. Respect rate limits.' },
      },
      required: ['session_id', 'script', 'next_page_selector'],
    },
  },
  {
    name: 'extract_table',
    description: 'Extract table data as structured array of objects',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        selector: { type: 'string' },
        use_first_row_as_headers: { type: 'boolean', default: true },
      },
      required: ['session_id', 'selector'],
    },
  },
];

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Type assertion since MCP schema validation ensures args exists
    const params = args as any;

    switch (name) {
      case 'create_browser_session': {
        const sessionId = await browserManager.createSession(params || {});
        return { content: [{ type: 'text', text: JSON.stringify({ session_id: sessionId, status: 'ready' }) }] };
      }

      case 'close_browser_session': {
        await browserManager.closeSession(params.session_id);
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'closed' }) }] };
      }

      case 'navigate': {
        const result = await navigate(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'go_back': {
        const result = await goBack(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'reload': {
        const result = await reload(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'click': {
        const result = await click(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'type_text': {
        const result = await typeText(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'scroll': {
        const result = await scroll(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'execute_js': {
        const result = await executeJs(browserManager, params);
        // Limit JS execution results to prevent payload overflow
        const resultStr = JSON.stringify(result.result);
        const MAX_RESULT_LENGTH = 100000; // 100KB limit
        if (resultStr.length > MAX_RESULT_LENGTH) {
          return { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify({ 
                result: '[Result too large to return]',
                truncated: true,
                original_size: resultStr.length 
              }) 
            }] 
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_html': {
        const result = await getHtml(browserManager, params);
        // Truncate large HTML responses to prevent payload issues
        const MAX_HTML_LENGTH = 100000; // 100KB limit
        if (result.html && result.html.length > MAX_HTML_LENGTH) {
          result.html = result.html.substring(0, MAX_HTML_LENGTH) + `\n\n[... HTML truncated. Original length: ${result.html.length} characters]`;
        }
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_text': {
        const result = await getText(browserManager, params);
        // Truncate large text responses
        const MAX_TEXT_LENGTH = 50000; // 50KB limit
        if (result.text && result.text.length > MAX_TEXT_LENGTH) {
          result.text = result.text.substring(0, MAX_TEXT_LENGTH) + `\n\n[... text truncated. Original length: ${result.text.length} characters]`;
        }
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_element_info': {
        const result = await getElementInfo(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_selector_for_point': {
        const result = await getSelectorForPoint(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'find_elements': {
        const result = await findElements(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'take_screenshot': {
        const result = await takeScreenshot(browserManager, params);

        // If screenshot has warning (too large), return as text
        if (result.warning) {
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }

        // If screenshot was saved to path, return path info as text
        if (result.path) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                path: result.path,
                size: result.size,
                message: `Screenshot saved to ${result.path} (${result.size}KB)`
              })
            }]
          };
        }

        // If screenshot is base64, return as proper MCP ImageContent
        if (result.base64) {
          const format = params.format || 'png';
          return {
            content: [
              {
                type: 'image',
                data: result.base64,
                mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
              },
            ],
          };
        }

        // Fallback
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_viewport_info': {
        const result = await getViewportInfo(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'wait_for': {
        const result = await waitFor(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_cookies': {
        const result = await getCookies(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'set_cookies': {
        const result = await setCookies(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'get_local_storage': {
        const result = await getLocalStorage(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'enable_request_interception': {
        browserManager.enableRequestInterception(params.session_id, params.url_pattern);
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'enabled', pattern: params.url_pattern }) }] };
      }

      case 'get_network_requests': {
        const requests = browserManager.getNetworkRequests(params.session_id, params.filter);
        const result = params.include_response_body 
          ? requests 
          : requests.map(({ responseBody, ...rest }) => rest);
        return { content: [{ type: 'text', text: JSON.stringify({ requests: result }) }] };
      }

      case 'execute_js_on_all_pages': {
        const result = await executeJsOnAllPages(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      case 'extract_table': {
        const result = await extractTable(browserManager, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log error to stderr for debugging
    console.error(`[MCP Tool Error] ${name}:`, errorMessage);
    if (errorStack) {
      console.error(errorStack);
    }
    
    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({ 
          error: errorMessage,
          tool: name,
          timestamp: new Date().toISOString()
        }) 
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Browser Automation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  await browserManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserManager.cleanup();
  process.exit(0);
});
