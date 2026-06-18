## 1. Storage Schema and Preload IPC Wiring

- [x] 1.1 Update workspace defaults in `src/main/storage.js` to support `mockPort` (default 5683) and `mockRoutes` (empty array).
- [x] 1.2 Implement main process IPC handlers in `src/main/index.js` for `mock-server:start`, `mock-server:stop`, and status checking.
- [x] 1.3 Expose mock server start, stop, and incoming request hooks in the preload script `src/preload/index.js`.

## 2. CoAP Mock Server Daemon

- [x] 2.1 Create the mock server daemon manager in `src/main/mockServer.js` using the standard `coap` package.
- [x] 2.2 Implement resource route dispatcher in `src/main/mockServer.js` mapping incoming path and method parameters to workspace config routes.
- [x] 2.3 Implement the NodeJS `vm` sandboxed evaluator in `src/main/mockServer.js` exposing request details, custom response bindings, and activity console logging.

## 3. Sidebar Navigation and Mock Server UI Panel

- [x] 3.1 Implement a third tab option for "Mock Server" in the Left Sidebar view selector.
- [x] 3.2 Build the Mock Server Sidebar controller pane showing the list of active routes, add/delete route buttons, and selected route state.
- [x] 3.3 Create the Main Mock Server Dashboard editor displaying the Server status header (badge, port input, start/stop button) and route script editor with line numbers gutter.
- [x] 3.4 Add an incoming Request activity console list in the Mock Server UI to log incoming traffic in real-time.

## 4. Verification

- [x] 4.1 Verify workspace JSON files store mock configurations correctly.
- [x] 4.2 Test starting and stopping mock server on port 5683 and custom ports.
- [x] 4.3 Test routing requests to the mock server and running sandbox code to produce response payloads.
