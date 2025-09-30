# Browser Automation MCP - Best Practices

## ✅ DO This

### 1. Use `execute_js` for Data Extraction
**Best tool for scraping** - Extract specific data, not full HTML:

```javascript
execute_js({
  session_id,
  script: `
    Array.from(document.querySelectorAll('.program-card'))
      .slice(0, 50) // Limit results
      .map(card => ({
        title: card.querySelector('.title')?.textContent?.trim(),
        url: card.querySelector('a')?.href,
        region: card.querySelector('.region')?.textContent?.trim()
      }))
  `
})
```

### 2. Check for APIs First
**Discover hidden APIs** before HTML scraping:

```javascript
// Before navigation
enable_request_interception({ 
  session_id, 
  url_pattern: ".*api.*" // or ".*xhr.*" or ".*"
});

// Navigate
navigate({ session_id, url: "..." });

// Check what API calls were made
get_network_requests({ 
  session_id,
  filter: { resource_type: "xhr" },
  include_response_body: true // See API responses!
});
```

### 3. Provide Selectors to Limit Scope
**Always scope your queries**:

```javascript
// ✅ Good - gets specific element
get_html({ session_id, selector: '.program-list' })

// ❌ Bad - gets entire page (may truncate)
get_html({ session_id })
```

### 4. Use Auto-Pagination
**Let the tool handle pagination**:

```javascript
execute_js_on_all_pages({
  session_id,
  script: `/* extraction script */`,
  next_page_selector: '.next-page-button',
  max_pages: 20, // Start small!
  wait_between_pages: 1000 // Respect rate limits
})
```

### 5. Limit Result Sizes
**Return small, structured data**:

```javascript
// ✅ Good - limited results
.slice(0, 50).map(el => ({title: el.textContent}))

// ❌ Bad - thousands of results
.map(el => el.outerHTML) // Also bad - HTML is large
```

---

## ❌ DON'T Do This

### 1. Don't Call `get_html` Without Selector on Large Pages
```javascript
// ❌ Will truncate at 100KB
get_html({ session_id }) // on complex site

// ✅ Better
get_html({ session_id, selector: '#main-content' })

// ✅ Best
execute_js({ session_id, script: '/* targeted extraction */' })
```

### 2. Don't Extract Too Much Data at Once
```javascript
// ❌ Too much - will likely fail
Array.from(document.querySelectorAll('*')).map(el => el.outerHTML)

// ✅ Limited and structured
Array.from(document.querySelectorAll('.item')).slice(0, 100)
  .map(el => ({id: el.id, text: el.textContent}))
```

### 3. Don't Set `max_pages` Too High Initially
```javascript
// ❌ Risk of timeout
execute_js_on_all_pages({ ..., max_pages: 500 })

// ✅ Start conservative, scale up
execute_js_on_all_pages({ ..., max_pages: 10 })
```

### 4. Don't Forget to Enable Interception Before Navigation
```javascript
// ❌ Wrong order
navigate({ session_id, url: "..." });
enable_request_interception({ session_id, url_pattern: ".*" }); // Too late!

// ✅ Correct order
enable_request_interception({ session_id, url_pattern: ".*" });
navigate({ session_id, url: "..." });
```

---

## Tool-Specific Guidance

### `execute_js` (Primary Scraping Tool)
- **Limit results**: `.slice(0, N)` before mapping
- **Extract specific fields**: Don't return raw HTML
- **Handle nulls**: Use `?.` optional chaining
- **Return arrays/objects**: Avoid returning DOM elements

### `get_html` (Secondary Tool)
- **Always provide selector** for large pages
- **Use for offline analysis**: When you need raw HTML
- **Will truncate**: At 100KB automatically
- **Alternative**: `execute_js` with `.innerHTML`

### `enable_request_interception` (API Discovery)
- **Call first**: Before `navigate`
- **Common patterns**: `".*api.*"`, `".*xhr.*"`, `".*fetch.*"`
- **Check responses**: `include_response_body: true`
- **Often reveals**: Easier JSON endpoints vs HTML scraping

### `execute_js_on_all_pages` (Batch Scraping)
- **Start small**: `max_pages: 10-20` initially
- **Test single page first**: Use `execute_js` first
- **Respect rate limits**: `wait_between_pages: 1000-2000`
- **Check result size**: May need to limit items per page

### `get_network_requests` (API Analysis)
- **Filter smart**: `resource_type: "xhr"` or `"fetch"`
- **Include bodies**: `include_response_body: true` to see JSON
- **Look for patterns**: Often shows data endpoint structure

---

## Workflow for Scraping a New Site

### Step 1: Reconnaissance
```javascript
// Create session
const { session_id } = create_browser_session({ headless: true });

// Enable network inspection
enable_request_interception({ session_id, url_pattern: ".*" });

// Navigate
navigate({ session_id, url: "https://target-site.com" });

// Check for APIs
const { requests } = get_network_requests({
  session_id,
  filter: { resource_type: "xhr" },
  include_response_body: true
});
// If you find JSON APIs, you're done! Use those instead.
```

### Step 2: Structure Analysis
```javascript
// Take screenshot to see layout
take_screenshot({ session_id });

// Find key elements
find_elements({ 
  session_id, 
  query: { text: "Program" } // or whatever you're looking for
});

// Get sample HTML of list container
get_html({ session_id, selector: '.program-list' });
```

### Step 3: Extraction Testing
```javascript
// Test extraction on single page
const results = execute_js({
  session_id,
  script: `
    Array.from(document.querySelectorAll('.item')).slice(0, 5).map(el => ({
      title: el.querySelector('.title')?.textContent,
      // ... other fields
    }))
  `
});
// Review results, adjust selectors
```

### Step 4: Pagination
```javascript
// Check pagination structure
execute_js({
  session_id,
  script: `document.querySelector('.next-button') !== null`
});

// If pagination exists, use auto-paginate
const all_data = execute_js_on_all_pages({
  session_id,
  script: `/* your tested extraction script */`,
  next_page_selector: '.next-button',
  max_pages: 10 // Start small, scale up
});
```

### Step 5: Cleanup
```javascript
close_browser_session({ session_id });
```

---

## Response Size Limits (Built-In)

- **HTML**: 100KB max (truncates with message)
- **Text**: 50KB max (truncates with message)
- **JS Results**: 100KB max (returns metadata if exceeded)

**These limits prevent session corruption.** Always extract targeted data rather than full content.

---

## Debugging Tips

### Session Issues
- **Create new session** if previous one failed
- **Check error messages** - now include tool name and timestamp
- **Restart Claude Desktop** if tools stop working

### Data Extraction
- **Test in browser console first** - Copy your JS into DevTools
- **Start small** - Extract 1 item, then 5, then 50
- **Check for dynamic loading** - May need `wait_for` or scroll

### Performance
- **Limit concurrent sessions** - Max 10 (built-in)
- **Use headless mode** - `headless: true` (default)
- **Add delays** - `wait_between_pages: 1000+`

---

## Updated Defaults (v1.0.2)

- `execute_js_on_all_pages.max_pages`: 100 → **20** (safer)
- `enable_request_interception.url_pattern`: no default → **".*api.*"** (common case)
- HTML/Text truncation: **Automatic** with clear messages
- Error logging: **Enhanced** with tool name and timestamp

---

**Restart Claude Desktop** to load the updated tool descriptions and defaults!
