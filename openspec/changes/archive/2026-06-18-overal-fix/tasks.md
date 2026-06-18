## 1. Stacked Layout and Resizable Dividers

- [x] 1.1 Implement horizontal drag-to-resize divider state and event handlers for Request and Response panels in `src/renderer/src/App.jsx`.
- [x] 1.2 Implement vertical drag-to-resize divider state and event handlers for Sidebar and Main content panel in `src/renderer/src/App.jsx`.
- [x] 1.3 Update the layout structure in `src/renderer/src/App.jsx` to stack the Request panel above the Response panel with divider handles.

## 2. Bi-directional Query Parameter and URL Sync

- [x] 2.1 Implement base-URL query-string parsing function in `src/renderer/src/App.jsx` to synchronize parameters to key-value rows.
- [x] 2.2 Implement parameter rows to query-string serialization function to automatically update the URL input field.
- [x] 2.3 Bind event change handlers on both inputs to trigger bidirectional updates without circular recursion.

## 3. Variable Autocomplete Suggestions Dropdown

- [x] 3.1 Implement a floating `VariableSuggestions` autocomplete dropdown overlay component in `src/renderer/src/App.jsx`.
- [x] 3.2 Bind keyboard and mouse navigation selection helpers (arrow keys, Enter, click) to select the variable.
- [x] 3.3 Add text focus query detection on URL, query param tables, options table, and payload textareas for `{{` pattern, displaying the suggestions popover at the cursor's focus position.

## 4. Payload Type Formatter & Option Serialization

- [x] 4.1 Update `getInitialWorkspaceState` and request structures to support `payloadType` (text or json).
- [x] 4.2 Add payload formatting tabs (JSON vs Text) and validation logic to flag invalid JSON syntax in the payload editor.
- [x] 4.3 Update the request engine options to automatically set CoAP Option `Content-Format` (number 12) to `application/json` (value 50) when transmitting a JSON payload.

## 5. NodeJS Script Editor Gutter

- [x] 5.1 Implement custom gutter scroll synchronizer in script panels to display code line numbers alongside preScript/postScript textareas.
- [x] 5.2 Style the script panels with a true code-editor aesthetic matching the IDE theme.

## 6. Verification

- [x] 6.1 Test panel resizing, bi-directional query param/URL sync, and variable suggestion dropdown insertions.
- [x] 6.2 Test pre-request and post-request script gutters scrolling synchrony.
- [x] 6.3 Verify JSON request transmission maps the CoAP Content-Format option to 50 correctly.
