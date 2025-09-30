# Quick Start Guide

## Setup (One-Time)

1. **Install Playwright browsers**:
```bash
cd /Users/a1984/subsidy4u/browser-automation-mcp
npx playwright install chromium
```

2. **Configure Claude Desktop**:

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

3. **Restart Claude Desktop**

## Testing

In Claude Desktop, try:

> Can you use the browser automation tools to:
> 1. Create a browser session
> 2. Navigate to https://example.com
> 3. Execute JavaScript to get the page title: `document.title`
> 4. Take a screenshot
> 5. Close the session

You should see Claude using these tools:
- `create_browser_session`
- `navigate`
- `execute_js`
- `take_screenshot`
- `close_browser_session`

## Next: Scrape Förderdatenbank

Once testing works, try:

> Navigate to https://www.foerderdatenbank.de/SiteGlobals/FDB/Forms/Suche/Startseitensuche_Formular.html?filterCategories=FundingProgram&submit=Suchen
> 
> Enable network interception to check if there are any API calls.
> 
> Then extract the structure of the program cards on the page using execute_js.

This will help us understand how to scrape the data.

## Troubleshooting

**Tools not showing up?**
- Check config file path is exactly: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Verify the `args` path points to your built `dist/index.js`
- Restart Claude Desktop completely (quit and reopen)

**Build errors?**
```bash
cd /Users/a1984/subsidy4u/browser-automation-mcp
npm run build
```

**Playwright errors?**
```bash
npx playwright install chromium --with-deps
```

## Available Tools Summary

**Essential for scraping:**
- `execute_js` - Run any JavaScript to extract data
- `get_html` - Get raw HTML for parsing
- `navigate` - Load pages
- `enable_request_interception` - Capture API calls
- `get_network_requests` - View intercepted requests

**Helper tools:**
- `scroll` - Handle infinite scroll
- `click` - Navigate pagination
- `wait_for` - Wait for dynamic content
- `execute_js_on_all_pages` - Auto-paginate

**Debugging:**
- `take_screenshot` - Visual inspection
- `get_element_info` - Inspect elements
- `find_elements` - Search for selectors
