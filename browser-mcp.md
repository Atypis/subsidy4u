# Browser Automation MCP Server Specification

## Overview

A Model Context Protocol (MCP) server that provides browser automation capabilities through Playwright, enabling AI assistants to perform web scraping, testing, and interaction tasks with full JavaScript execution, DOM access, and network inspection.

---

## Motivation

Current browser automation tools available to AI assistants are limited:
- ❌ No direct HTML/DOM access
- ❌ No CSS selector or XPath capabilities
- ❌ No JavaScript execution
- ❌ No network request inspection
- ❌ Inefficient for bulk data extraction

This MCP server bridges that gap by exposing Playwright's full capabilities through a structured tool interface.

---

## Architecture

### Tech Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: `@modelcontextprotocol/sdk`
- **Browser Automation**: `playwright`
- **Build**: `tsup` or `tsc`

### Project Structure
```
browser-automation-mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── browser-manager.ts       # Session lifecycle management
│   ├── tools/
│   │   ├── navigation.ts        # navigate, go_back, reload
│   │   ├── interaction.ts       # click, type, scroll
│   │   ├── extraction.ts        # execute_js, get_html, get_text
│   │   ├── inspection.ts        # get_selector, find_elements
│   │   ├── network.ts           # get_requests, intercept
│   │   └── visual.ts            # screenshot, get_viewport
│   ├── types.ts                 # Shared TypeScript types
│   └── utils.ts                 # Helper functions
├── package.json
├── tsconfig.json
└── README.md
```

---

## Tool Specifications

### 1. Session Management

#### `create_browser_session`
**Description**: Launches a new browser session with configurable options.

**Parameters**:
```json
{
  "headless": {
    "type": "boolean",
    "default": true,
    "description": "Run browser in headless mode"
  },
  "viewport": {
    "type": "object",
    "properties": {
      "width": {"type": "number", "default": 1280},
      "height": {"type": "number", "default": 720}
    }
  },
  "userAgent": {
    "type": "string",
    "optional": true,
    "description": "Custom user agent string"
  },
  "browser": {
    "type": "string",
    "enum": ["chromium", "firefox", "webkit"],
    "default": "chromium"
  }
}
```

**Returns**:
```json
{
  "session_id": "uuid-string",
  "status": "ready"
}
```

**Example**:
```json
{
  "headless": false,
  "viewport": {"width": 1920, "height": 1080}
}
```

---

#### `close_browser_session`
**Description**: Closes an active browser session.

**Parameters**:
```json
{
  "session_id": {
    "type": "string",
    "required": true
  }
}
```

**Returns**:
```json
{
  "status": "closed"
}
```

---

### 2. Navigation

#### `navigate`
**Description**: Navigate to a URL.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "url": {"type": "string", "required": true},
  "wait_until": {
    "type": "string",
    "enum": ["load", "domcontentloaded", "networkidle"],
    "default": "load"
  }
}
```

**Returns**:
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "status": 200
}
```

---

#### `go_back`
**Description**: Navigate back in history.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true}
}
```

---

#### `reload`
**Description**: Reload current page.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "ignore_cache": {"type": "boolean", "default": false}
}
```

---

### 3. Interaction

#### `click`
**Description**: Click an element.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {"type": "string", "required": true},
  "wait_for_selector": {"type": "boolean", "default": true},
  "timeout": {"type": "number", "default": 30000}
}
```

**Example**:
```json
{
  "session_id": "abc-123",
  "selector": "button.submit"
}
```

---

#### `type_text`
**Description**: Type text into an input field.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {"type": "string", "required": true},
  "text": {"type": "string", "required": true},
  "clear_first": {"type": "boolean", "default": true},
  "delay": {"type": "number", "default": 0, "description": "Delay between keystrokes (ms)"}
}
```

---

#### `scroll`
**Description**: Scroll page or to specific element.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "direction": {
    "type": "string",
    "enum": ["down", "up", "to_element", "to_bottom"],
    "default": "down"
  },
  "selector": {
    "type": "string",
    "optional": true,
    "description": "Required if direction is 'to_element'"
  },
  "pixels": {
    "type": "number",
    "optional": true,
    "description": "Number of pixels to scroll (for up/down)"
  }
}
```

**Example**:
```json
{
  "session_id": "abc-123",
  "direction": "to_element",
  "selector": ".program-list"
}
```

---

### 4. Data Extraction (Critical)

#### `execute_js`
**Description**: Execute arbitrary JavaScript in page context. **Most powerful tool.**

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "script": {
    "type": "string",
    "required": true,
    "description": "JavaScript code to execute. Must return JSON-serializable value."
  }
}
```

**Returns**:
```json
{
  "result": "any JSON-serializable value"
}
```

**Examples**:

Extract all program titles:
```javascript
Array.from(document.querySelectorAll('.program-title'))
  .map(el => el.textContent.trim())
```

Extract structured data:
```javascript
Array.from(document.querySelectorAll('.program-card')).map(card => ({
  title: card.querySelector('.title')?.textContent,
  description: card.querySelector('.description')?.textContent,
  url: card.querySelector('a')?.href
}))
```

Check if element exists:
```javascript
document.querySelector('.next-page-button') !== null
```

Get page state:
```javascript
({
  url: window.location.href,
  scrollHeight: document.documentElement.scrollHeight,
  scrollY: window.scrollY
})
```

---

#### `get_html`
**Description**: Get raw HTML of page or specific element.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {
    "type": "string",
    "optional": true,
    "description": "If provided, returns HTML of that element. Otherwise, returns full page HTML."
  },
  "outer_html": {
    "type": "boolean",
    "default": true,
    "description": "Return outerHTML (includes element itself) vs innerHTML"
  }
}
```

**Returns**:
```json
{
  "html": "<div class='content'>...</div>"
}
```

---

#### `get_text`
**Description**: Get visible text content.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {
    "type": "string",
    "optional": true,
    "description": "If provided, returns text of that element. Otherwise, returns body text."
  }
}
```

**Returns**:
```json
{
  "text": "All visible text content..."
}
```

---

#### `get_element_info`
**Description**: Get detailed information about an element.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {"type": "string", "required": true}
}
```

**Returns**:
```json
{
  "text": "Element text content",
  "attributes": {
    "class": "btn btn-primary",
    "id": "submit-btn",
    "data-testid": "submit"
  },
  "boundingBox": {
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 40
  },
  "isVisible": true,
  "tagName": "BUTTON"
}
```

---

### 5. Selector Discovery

#### `get_selector_for_point`
**Description**: Get CSS selector for element at specific coordinates (hit-test).

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "x": {"type": "number", "required": true},
  "y": {"type": "number", "required": true}
}
```

**Returns**:
```json
{
  "selector": "div.container > button.submit",
  "element_info": {
    "tagName": "BUTTON",
    "text": "Submit"
  }
}
```

**Use Case**: Click on element in screenshot, get its selector.

---

#### `find_elements`
**Description**: Find elements matching criteria (text, attributes, role).

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "query": {
    "type": "object",
    "properties": {
      "text": {"type": "string", "description": "Text content to match"},
      "role": {"type": "string", "description": "ARIA role"},
      "attributes": {
        "type": "object",
        "description": "Key-value pairs of attributes"
      }
    }
  },
  "limit": {"type": "number", "default": 10}
}
```

**Returns**:
```json
{
  "elements": [
    {
      "selector": "button[data-testid='submit']",
      "text": "Submit Form",
      "attributes": {"class": "btn-primary"}
    }
  ]
}
```

**Example**:
```json
{
  "session_id": "abc-123",
  "query": {
    "text": "Förder",
    "attributes": {"class": "program-title"}
  }
}
```

---

### 6. Network Inspection

#### `get_network_requests`
**Description**: Get list of network requests made by the page.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "filter": {
    "type": "object",
    "optional": true,
    "properties": {
      "url_pattern": {"type": "string", "description": "Regex pattern"},
      "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE"]},
      "resource_type": {"type": "string", "enum": ["xhr", "fetch", "document", "image"]}
    }
  },
  "include_response_body": {"type": "boolean", "default": false}
}
```

**Returns**:
```json
{
  "requests": [
    {
      "url": "https://api.example.com/programs",
      "method": "GET",
      "status": 200,
      "resourceType": "xhr",
      "response_body": "{\"programs\": [...]}"
    }
  ]
}
```

**Use Case**: Discover hidden APIs that load data dynamically.

---

#### `enable_request_interception`
**Description**: Start intercepting network requests (must be called before navigate).

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "url_pattern": {
    "type": "string",
    "required": true,
    "description": "Regex pattern to intercept"
  }
}
```

**Returns**:
```json
{
  "status": "enabled",
  "pattern": ".*api.*"
}
```

**Note**: Intercepted requests will be stored and retrievable via `get_network_requests`.

---

### 7. Visual Inspection

#### `take_screenshot`
**Description**: Capture screenshot of page or element.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {
    "type": "string",
    "optional": true,
    "description": "If provided, screenshot only this element"
  },
  "full_page": {"type": "boolean", "default": false},
  "format": {"type": "string", "enum": ["png", "jpeg"], "default": "png"},
  "path": {
    "type": "string",
    "optional": true,
    "description": "File path to save screenshot"
  }
}
```

**Returns**:
```json
{
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "path": "/tmp/screenshot-123.png"
}
```

---

#### `get_viewport_info`
**Description**: Get current viewport dimensions and scroll position.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true}
}
```

**Returns**:
```json
{
  "width": 1280,
  "height": 720,
  "scrollX": 0,
  "scrollY": 1500,
  "scrollHeight": 5000
}
```

---

### 8. Waiting & Timing

#### `wait_for`
**Description**: Wait for specific condition before continuing.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "condition": {
    "type": "string",
    "enum": ["selector", "navigation", "network_idle", "timeout"],
    "required": true
  },
  "target": {
    "type": "string",
    "optional": true,
    "description": "Selector or URL pattern (depending on condition)"
  },
  "timeout": {"type": "number", "default": 30000}
}
```

**Examples**:

Wait for element:
```json
{
  "condition": "selector",
  "target": ".program-list"
}
```

Wait for navigation:
```json
{
  "condition": "navigation"
}
```

Wait for network idle:
```json
{
  "condition": "network_idle"
}
```

Simple timeout:
```json
{
  "condition": "timeout",
  "timeout": 2000
}
```

---

### 9. Advanced Utilities

#### `execute_js_on_all_pages`
**Description**: Execute JavaScript on current page, then paginate and repeat until no more pages.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "script": {
    "type": "string",
    "required": true,
    "description": "JS to execute on each page"
  },
  "next_page_selector": {
    "type": "string",
    "required": true,
    "description": "Selector for 'next page' button/link"
  },
  "max_pages": {"type": "number", "default": 100},
  "wait_between_pages": {"type": "number", "default": 1000}
}
```

**Returns**:
```json
{
  "results": [
    {"page": 1, "data": [...]},
    {"page": 2, "data": [...]}
  ],
  "total_pages": 15
}
```

**Use Case**: Auto-paginate through search results and extract data from each page.

---

#### `extract_table`
**Description**: Extract table data as structured array of objects.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "selector": {"type": "string", "required": true},
  "use_first_row_as_headers": {"type": "boolean", "default": true}
}
```

**Returns**:
```json
{
  "data": [
    {"Name": "Program A", "Region": "Bayern", "Type": "Zuschuss"},
    {"Name": "Program B", "Region": "Berlin", "Type": "Darlehen"}
  ],
  "row_count": 2
}
```

---

### 10. State Management

#### `get_cookies`
**Description**: Get all cookies for current page.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true}
}
```

**Returns**:
```json
{
  "cookies": [
    {"name": "session_id", "value": "abc123", "domain": ".example.com"}
  ]
}
```

---

#### `set_cookies`
**Description**: Set cookies before navigation.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true},
  "cookies": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "value": {"type": "string"},
        "domain": {"type": "string"},
        "path": {"type": "string", "default": "/"}
      }
    }
  }
}
```

---

#### `get_local_storage`
**Description**: Get localStorage data from current page.

**Parameters**:
```json
{
  "session_id": {"type": "string", "required": true}
}
```

**Returns**:
```json
{
  "data": {
    "user_prefs": "{...}",
    "session_token": "xyz"
  }
}
```

---

## Implementation Notes

### Session Management
- Each session corresponds to one Playwright `BrowserContext`
- Sessions are isolated (separate cookies, storage, cache)
- Maximum 10 concurrent sessions to prevent resource exhaustion
- Auto-cleanup after 30 minutes of inactivity

### Error Handling
All tools return errors in consistent format:
```json
{
  "error": {
    "code": "SELECTOR_NOT_FOUND",
    "message": "Element matching selector '.non-existent' not found",
    "details": {
      "selector": ".non-existent",
      "timeout": 30000
    }
  }
}
```

**Error Codes**:
- `SESSION_NOT_FOUND` - Invalid session_id
- `SELECTOR_NOT_FOUND` - Element not found
- `TIMEOUT` - Operation timed out
- `NAVIGATION_FAILED` - Page failed to load
- `JS_EXECUTION_ERROR` - JavaScript threw error
- `INVALID_PARAMETER` - Bad input

### Performance Considerations
- **Selectors**: Prefer CSS selectors over XPath (faster in most cases)
- **JavaScript execution**: Runs in page context, very fast
- **Screenshots**: Full-page screenshots can be slow for long pages
- **Network recording**: Has slight performance overhead, enable only when needed

### Security
- JavaScript execution is sandboxed to page context (cannot access Node.js/host)
- File system access limited to designated screenshot directory
- Rate limiting: Max 100 tool calls per minute per session

---

## Usage Examples

### Example 1: Scrape Förderdatenbank

```javascript
// 1. Create session
const session = await create_browser_session({
  headless: true,
  viewport: {width: 1920, height: 1080}
});

// 2. Navigate to search results
await navigate({
  session_id: session.session_id,
  url: "https://www.foerderdatenbank.de/...",
  wait_until: "networkidle"
});

// 3. Enable network inspection (check for API calls)
await enable_request_interception({
  session_id: session.session_id,
  url_pattern: ".*api.*"
});

// 4. Extract program data from current page
const programs = await execute_js({
  session_id: session.session_id,
  script: `
    Array.from(document.querySelectorAll('.program-item')).map(item => ({
      title: item.querySelector('.title')?.textContent.trim(),
      region: item.querySelector('.region')?.textContent.trim(),
      url: item.querySelector('a')?.href
    }))
  `
});

// 5. Check if there's a next page button
const hasNextPage = await execute_js({
  session_id: session.session_id,
  script: `document.querySelector('.next-page') !== null`
});

// 6. Close session
await close_browser_session({session_id: session.session_id});
```

---

### Example 2: Extract Program Details

```javascript
// Navigate to program detail page
await navigate({
  session_id: session.session_id,
  url: "https://www.foerderdatenbank.de/program/12345"
});

// Get full page HTML for offline analysis
const html = await get_html({
  session_id: session.session_id
});

// Extract structured legal requirements
const requirements = await execute_js({
  session_id: session.session_id,
  script: `
    const section = document.querySelector('.legal-requirements');
    return {
      title: section?.querySelector('h2')?.textContent,
      criteria: Array.from(section?.querySelectorAll('li') || [])
        .map(li => li.textContent.trim())
    }
  `
});
```

---

### Example 3: Check for Hidden API

```javascript
// Enable network inspection
await enable_request_interception({
  session_id: session.session_id,
  url_pattern: ".*"
});

// Navigate and trigger API calls
await navigate({
  session_id: session.session_id,
  url: "https://www.foerderdatenbank.de/..."
});

// Get all XHR/Fetch requests
const requests = await get_network_requests({
  session_id: session.session_id,
  filter: {
    resource_type: "xhr",
    method: "GET"
  },
  include_response_body: true
});

// Check if any requests return JSON with program data
const apiEndpoint = requests.find(req => 
  req.url.includes('api') && 
  req.response_body.includes('program')
);
```

---

## Configuration File

**mcp-config.json** (for Claude Desktop or other MCP clients):
```json
{
  "mcpServers": {
    "browser-automation": {
      "command": "node",
      "args": ["/path/to/browser-automation-mcp/dist/index.js"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "/path/to/playwright/browsers"
      }
    }
  }
}
```

---

## Installation & Setup

```bash
# Initialize project
npm init -y
npm install @modelcontextprotocol/sdk playwright typescript tsup

# Install browsers
npx playwright install chromium

# Build
npm run build

# Run (for testing)
node dist/index.js
```

---

## Testing Strategy

### Unit Tests
- Test each tool in isolation
- Mock Playwright page/browser objects
- Validate parameter parsing

### Integration Tests
- Launch actual browser
- Test against real websites (httpbin.org, example.com)
- Verify data extraction accuracy

### Performance Tests
- Concurrent session handling
- Memory leak detection
- Long-running session stability

---

## Future Enhancements

**Priority 2**:
- [ ] **Multi-tab support**: Open and manage multiple tabs
- [ ] **File uploads**: `upload_file(selector, path)`
- [ ] **Download management**: Track and access downloaded files
- [ ] **Browser profiles**: Persist login sessions across restarts
- [ ] **Stealth mode**: Evade bot detection (puppeteer-stealth equivalent)
- [ ] **Proxy support**: Route traffic through proxies
- [ ] **Mobile emulation**: Test mobile-specific sites
- [ ] **Geolocation**: Set GPS coordinates
- [ ] **Performance metrics**: Measure page load times, resource usage

**Priority 3**:
- [ ] **Recording**: Record and replay user interactions
- [ ] **A11y testing**: Accessibility audit tools
- [ ] **Visual regression**: Compare screenshots across runs
- [ ] **HAR export**: Export full network trace

---

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "playwright": "^1.40.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## License & Attribution

**License**: MIT  
**Maintainer**: TBD  
**Repository**: TBD  
**Documentation**: See README.md for detailed API docs

---

**Last Updated**: 2025-09-30  
**Status**: Specification Complete - Ready for Implementation
