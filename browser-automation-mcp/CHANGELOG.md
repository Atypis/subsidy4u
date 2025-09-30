# Changelog

## [1.0.2] - 2025-09-30

### Fixed
- **Response size limits** to prevent session corruption
  - HTML: 100KB limit (truncates with message)
  - Text: 50KB limit (truncates with message) 
  - JS results: 100KB limit (returns metadata if exceeded)
- **Enhanced error handling** with tool name, timestamp, and stderr logging
- **Session stability** - prevents "internal error" crashes from large payloads

### Changed
- **Improved tool descriptions** with best practices and warnings
- **Better defaults**:
  - `execute_js_on_all_pages.max_pages`: 100 → 20 (safer default)
  - `enable_request_interception.url_pattern`: Now suggests common patterns
- **Guidance in descriptions**:
  - `execute_js`: Added example and best practice
  - `get_html`: Added warning about selector requirement
  - `get_text`: Added scope guidance
  - `enable_request_interception`: Added pattern recommendations
  - `get_network_requests`: Added API discovery tips
  - `execute_js_on_all_pages`: Added timeout warnings

### Added
- `BEST_PRACTICES.md` - Comprehensive scraping guide
- `BUG_REPORT.md` - Analysis of payload issue and fixes

## [1.0.1] - 2025-09-30

### Fixed
- TypeScript compilation errors with MCP args handling
- Type assertions for parameter passing

## [1.0.0] - 2025-09-30

### Added
- Initial release with 24 browser automation tools
- Session management (create/close)
- Navigation (navigate, go_back, reload)
- Interaction (click, type, scroll)
- Data extraction (execute_js, get_html, get_text, get_element_info)
- Inspection (find_elements, get_selector_for_point)
- Visual tools (screenshot, viewport_info)
- Network inspection (enable_request_interception, get_network_requests)
- State management (cookies, localStorage)
- Advanced features (execute_js_on_all_pages, extract_table)
- Waiting utilities (wait_for)
- Comprehensive documentation
