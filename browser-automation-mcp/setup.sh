#!/bin/bash

echo "Setting up Browser Automation MCP Server..."

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install chromium

# Build the project
echo "Building TypeScript..."
npm run build

# Get absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use with Claude Desktop, add this to your config:"
echo "~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "browser-automation": {'
echo '      "command": "node",'
echo "      \"args\": [\"$SCRIPT_DIR/dist/index.js\"]"
echo '    }'
echo '  }'
echo '}'
echo ""
