## 1. Storage & Core Schema Updates

- [x] 1.1 Update `src/main/storage.js` to initialize newly created workspace directory files empty (no default folders/requests).
- [x] 1.2 Update the workspace structure definition in storage.js to include `environments` (array) and `activeEnvironmentId` (string).

## 2. Variable Interpolation Parser Engine

- [x] 2.1 Implement variable interpolation regex resolver utility inside the renderer React application.
- [x] 2.2 Wire the variable parser to process URL, query parameters, options headers, and payloads before sending requests or launching observe streams.

## 3. Sidebar Toggle, Environment CRUD & Collection Deletion

- [x] 3.1 Implement a sidebar view switcher tab in `src/renderer/src/App.jsx` supporting Collections vs Environments views.
- [x] 3.2 Add UI configuration grids to add, rename, and delete environments and edit their key-value variables list.
- [x] 3.3 Add environment dropdown selector in the workspace headers to switch the active environment context.
- [x] 3.4 Add buttons to delete folder collections and all nested requests in the collection tree view.

## 4. Input Hovers, Tooltips & Node.js Script Help Reference

- [x] 4.1 Implement a custom React tooltip overlay component that displays resolved variable values on hover.
- [x] 4.2 Bind hover listeners to the URL input, query parameters, CoAP option tables, and payload editor fields.
- [x] 4.3 Add visual reference tips and language descriptions inside pre/post-request scripting panels to highlight Node.js support.

## 5. Verification

- [x] 5.1 Verify empty workspace initialization.
- [x] 5.2 Validate that variables placeholder formatting gets resolved over the wire correctly.
- [x] 5.3 Test environment deletion, collection deletion, and variable tooltip hovers.
