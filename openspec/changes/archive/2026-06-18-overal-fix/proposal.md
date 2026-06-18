## Why

The current CoAP client UI lacks essential features present in standard API clients like Postman or Bruno, such as interactive query parameter and URL query string auto-synchronization, variable autocomplete suggestions, payload format selectors, resizable UI panels, and a stacked request-response layout.

## What Changes

1. **Auto-complete Suggestions & IDE Scripts:** Provide variable color-highlighting and autocomplete options for `{{variable}}` patterns dynamically when typing in URL, options, payload, and script inputs. Provide a rich editor look-and-feel (like syntax highlighting) for NodeJS scripts.
2. **Synchronized Query Parameters:** Automatically sync inputs in the URL query string with the query parameters table, parsing and constructing URL queries bi-directionally.
3. **Payload Type Selector:** Add support for selecting request payload format (JSON vs. Text/Raw) with proper syntax formatting validation.
4. **Stacked & Resizable Panels:** Transition the UI layout to a stacked layout with the Request panel at the top and the Response panel at the bottom. Implement drag-to-resize handlers for both vertical (sidebar-main) and horizontal (request-response) dividers.

## Capabilities

### New Capabilities
<!-- None needed, we are extending existing capabilities -->

### Modified Capabilities
- `coap-client-ui`: Update UI layouts to stacked, resizable split panels, payload format selectors, and variable autocomplete dialogs.
- `coap-variable-parser`: Implement bi-directional query string parser-synchronizer and variable suggestion matches.
- `coap-request-engine`: Support payload type content formatting (e.g. valid JSON parsing) before request execution.

## Impact

- React renderer frontend (`App.jsx` layout, inputs, script textareas).
- CoAP request dispatcher integration (handling JSON vs raw payloads).
- Bidirectional query string synchronization logic in frontend inputs.
