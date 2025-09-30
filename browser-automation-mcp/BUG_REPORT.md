# Bug Report & Fix - Browser Automation MCP Server

## Issue Discovered

**Symptom**: MCP server initially worked but session became unrecoverable after several tool calls, with error:
```
Invalid argument: MCP servers might not be compatible with the model provider
an internal error occurred (error ID: ...)
```

## Root Cause

**Response Payload Overload**: The MCP server was returning unbounded data sizes, particularly from:
1. `get_html` - Full HTML of websites (can be 500KB+ for complex sites)
2. `get_text` - Large text extractions
3. `execute_js` - JavaScript execution results with massive datasets

When these large responses were JSON-stringified and sent back through the MCP protocol, they exceeded model provider limits or caused serialization issues, leading to session corruption.

## Fixes Applied (v1.0.1)

### 1. Response Size Limits

**get_html**:
- Max HTML length: 100KB
- Truncates with message: `[... HTML truncated. Original length: X characters]`

**get_text**:
- Max text length: 50KB  
- Truncates with message: `[... text truncated. Original length: X characters]`

**execute_js**:
- Max result size: 100KB (after JSON stringification)
- Returns metadata if exceeded: `{ result: '[Result too large]', truncated: true, original_size: X }`

### 2. Enhanced Error Handling

- Errors now logged to stderr for debugging
- Error responses include tool name and timestamp
- Stack traces captured for troubleshooting

### 3. Code Changes

**File**: `src/index.ts`

```typescript
// Before (problematic)
case 'get_html': {
  const result = await getHtml(browserManager, params);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}

// After (fixed)
case 'get_html': {
  const result = await getHtml(browserManager, params);
  const MAX_HTML_LENGTH = 100000;
  if (result.html && result.html.length > MAX_HTML_LENGTH) {
    result.html = result.html.substring(0, MAX_HTML_LENGTH) + 
      `\n\n[... HTML truncated. Original length: ${result.html.length} characters]`;
  }
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
```

## Testing Results Before Fix

✅ **Successful calls** (small payloads):
- `create_browser_session`
- `navigate`
- `get_viewport_info`
- `scroll`
- `click`
- `wait_for`

❌ **Failed calls** (large payloads):
- `get_html` on Hacker News (likely triggered the crash)
- Subsequent calls failed due to corrupted session

## Recommendations

### For Large Data Extraction

Instead of using `get_html` directly, use **targeted extraction**:

```javascript
// ❌ BAD - Gets entire HTML
get_html({ session_id, selector: undefined })

// ✅ GOOD - Get specific elements only
execute_js({ 
  session_id,
  script: `
    Array.from(document.querySelectorAll('.athing')).slice(0, 30).map(el => ({
      title: el.querySelector('.titleline')?.textContent,
      link: el.querySelector('.titleline a')?.href
    }))
  `
})
```

### For Website Scraping

1. **Use `execute_js` for targeted extraction** - Extract only what you need
2. **Process in chunks** - Don't try to get all 2,000 programs at once
3. **Use pagination** - Extract page by page with `execute_js_on_all_pages`
4. **Check network requests first** - Use `enable_request_interception` to find APIs

### Example: Scraping Förderdatenbank

```javascript
// 1. Enable network inspection to find API
enable_request_interception({ 
  session_id, 
  url_pattern: ".*" 
});

// 2. Navigate
navigate({ session_id, url: "..." });

// 3. Check for API calls
get_network_requests({ 
  session_id,
  filter: { resource_type: "xhr" },
  include_response_body: true 
});

// 4. Extract only program cards, not full HTML
execute_js({
  session_id,
  script: `
    Array.from(document.querySelectorAll('.program-card')).map(card => ({
      title: card.querySelector('.title')?.textContent?.trim(),
      region: card.querySelector('.region')?.textContent?.trim(),
      url: card.querySelector('a')?.href
    }))
  `
});
```

## Deployment

**Fixed version built**: ✅  
**Location**: `/Users/a1984/subsidy4u/browser-automation-mcp/dist/index.js`

**To apply fix**:
1. Changes already built (ran `npm run build`)
2. Restart Claude Desktop to reload MCP server
3. Test in new conversation

## Future Improvements

1. **Streaming support** - For very large datasets, stream results in chunks
2. **Compression** - Gzip large responses before sending
3. **Alternative return formats** - Support file-based returns for massive HTML
4. **Rate limiting** - Prevent too many rapid calls
5. **Session health checks** - Detect and auto-recover corrupted sessions

---

**Version**: 1.0.1  
**Fixed**: 2025-09-30  
**Status**: Ready for testing
