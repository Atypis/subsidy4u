# Browser Automation MCP Server

A Model Context Protocol (MCP) server providing browser automation capabilities through Playwright.

## Installation

```bash
npm install
npx playwright install chromium
npm run build
```

## Usage

### Configuration for Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "browser-automation": {
      "command": "node",
      "args": ["/Users/a1984/subsidy4u/browser-automation-mcp/dist/index.js"]
    }
  }
}
```

### Basic Workflow

1. **Create a session**:
```json
{
  "tool": "create_browser_session",
  "arguments": {
    "headless": false,
    "viewport": {"width": 1920, "height": 1080}
  }
}
```

2. **Navigate to URL**:
```json
{
  "tool": "navigate",
  "arguments": {
    "session_id": "your-session-id",
    "url": "https://example.com",
    "wait_until": "networkidle"
  }
}
```

3. **Extract data with JavaScript**:
```json
{
  "tool": "execute_js",
  "arguments": {
    "session_id": "your-session-id",
    "script": "Array.from(document.querySelectorAll('.item')).map(el => el.textContent)"
  }
}
```

4. **Close session**:
```json
{
  "tool": "close_browser_session",
  "arguments": {
    "session_id": "your-session-id"
  }
}
```

## Available Tools

### Session Management
- `create_browser_session` - Launch a new browser
- `close_browser_session` - Close browser session

### Navigation
- `navigate` - Go to URL
- `go_back` - Navigate back
- `reload` - Reload page

### Interaction
- `click` - Click element
- `type_text` - Type into input
- `scroll` - Scroll page

### Data Extraction
- `execute_js` - Run JavaScript in page context (most powerful!)
- `get_html` - Get raw HTML
- `get_text` - Get visible text
- `get_element_info` - Get element details

### Inspection
- `get_selector_for_point` - Hit-test for selector
- `find_elements` - Find elements by criteria

### Visual
- `take_screenshot` - Capture screenshot
- `get_viewport_info` - Get viewport dimensions

### Network
- `enable_request_interception` - Start capturing requests
- `get_network_requests` - Get captured requests

### Advanced
- `execute_js_on_all_pages` - Auto-paginate and extract
- `extract_table` - Parse HTML tables

### State
- `get_cookies` / `set_cookies` - Cookie management
- `get_local_storage` - Get localStorage data

### Waiting
- `wait_for` - Wait for conditions

## Example: Scraping Förderdatenbank

```javascript
// 1. Create session
const session = create_browser_session({ headless: true });

// 2. Enable network inspection
enable_request_interception({
  session_id: session.session_id,
  url_pattern: ".*"
});

// 3. Navigate
navigate({
  session_id: session.session_id,
  url: "https://www.foerderdatenbank.de/...",
  wait_until: "networkidle"
});

// 4. Check for API calls
const requests = get_network_requests({
  session_id: session.session_id,
  filter: { resource_type: "xhr" },
  include_response_body: true
});

// 5. Extract program data
const programs = execute_js({
  session_id: session.session_id,
  script: `
    Array.from(document.querySelectorAll('.program-card')).map(card => ({
      title: card.querySelector('.title')?.textContent.trim(),
      region: card.querySelector('.region')?.textContent.trim(),
      url: card.querySelector('a')?.href
    }))
  `
});

// 6. Paginate through all results
const allData = execute_js_on_all_pages({
  session_id: session.session_id,
  script: "/* extraction script */",
  next_page_selector: ".next-page-button",
  max_pages: 50
});

// 7. Close
close_browser_session({ session_id: session.session_id });
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Test locally
npm start
```

## Architecture

- **Session Management**: Each session = isolated browser context
- **Max Sessions**: 10 concurrent (configurable)
- **Auto-cleanup**: Sessions close after 30min inactivity
- **Error Handling**: Consistent error codes across all tools

## Error Codes

- `SESSION_NOT_FOUND` - Invalid session_id
- `SELECTOR_NOT_FOUND` - Element not found
- `TIMEOUT` - Operation timed out
- `NAVIGATION_FAILED` - Page failed to load
- `JS_EXECUTION_ERROR` - JavaScript threw error
- `INVALID_PARAMETER` - Bad input
- `MAX_SESSIONS_REACHED` - Too many concurrent sessions

## License

MIT
