## 1. Setup & Package Configuration

- [x] 1.1 Add the `coap` library dependency to `package.json` and run installation.
- [x] 1.2 Expose IPC bindings for storage, requesting, and scripting in the preload script (`src/preload/index.js`).

## 2. Storage & Workspace Backend

- [x] 2.1 Create storage handlers (`src/main/storage.js`) to load and save workspaces/collections locally using a simple JSON file store.
- [x] 2.2 Register main process IPC events for loading and saving the workspace layout tree.

## 3. CoAP Engine & Script Runner Backend

- [x] 3.1 Implement the CoAP networking engine (`src/main/coapEngine.js`) to parse requests, configure options, handle payload, and support request cancellation.
- [x] 3.2 Implement Observe stream handling inside the CoAP engine to push real-time responses to the renderer.
- [x] 3.3 Implement `src/main/scriptRunner.js` using Node's native `vm` module to run pre-request and post-request scripts safely.
- [x] 3.4 Wire main process IPC handlers in `src/main/index.js` to connect the CoAP engine and script runner.

## 4. Dual-Panel User Interface

- [x] 4.1 Scaffold the workspace layout state machine in `src/renderer/src/App.jsx`.
- [x] 4.2 Build the Left Sidebar workspace selector and collection/request tree.
- [x] 4.3 Build the Request Configuration Editor (methods, url, param/option key-value tables, and script inputs).
- [x] 4.4 Build the Response Viewer Panel (showing headers/options, formatted body, observe event logs, and script console output).

## 5. Verification

- [x] 5.1 Run local integration tests verifying GET, POST, PUT, DELETE request transmission and cancellation.
- [x] 5.2 Verify that the Observe GET stream correctly pushes notification updates.
- [x] 5.3 Verify that pre/post-request scripts execute and successfully log messages in the console.
