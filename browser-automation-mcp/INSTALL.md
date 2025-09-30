# Installation Guide

## Quick Setup

Run the setup script:

```bash
cd /Users/a1984/subsidy4u/browser-automation-mcp
./setup.sh
```

This will:
1. Install npm dependencies
2. Install Playwright Chromium browser
3. Build the TypeScript code
4. Show you the config to add to Claude Desktop

## Manual Setup

If you prefer manual installation:

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Build
npm run build
```

## Configure Claude Desktop

1. Open Claude Desktop config:
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. Add the MCP server configuration:
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

3. Restart Claude Desktop

## Verify Installation

In Claude Desktop, you should see the browser automation tools available. Try:

```
Can you create a browser session and navigate to example.com?
```

Claude should be able to use:
- `create_browser_session`
- `navigate`
- `execute_js`
- `close_browser_session`

## Troubleshooting

### "Cannot find module" error
Make sure you ran `npm run build` to compile TypeScript.

### "Playwright browser not found"
Run: `npx playwright install chromium`

### MCP server not showing up in Claude
1. Check config file path is correct
2. Restart Claude Desktop completely
3. Check Claude Desktop logs for errors

### Permission denied on setup.sh
Run: `chmod +x setup.sh`

## Testing Without Claude

You can test the server directly (though it uses stdio, so it's not very user-friendly):

```bash
npm start
```

Then send MCP protocol messages via stdin. Better to test through Claude Desktop.

## Next Steps

Once installed, check out the examples in README.md for scraping foerderdatenbank.de!
