## Why

Developers testing CoAP client requests need a local CoAP server to verify request transmission, verify custom payloads, and mock various response status codes without setting up separate external server processes.

## What Changes

1. **CoAP Mock Server Engine (Main Process):** Create a start/stop system in the Electron main process using the `coap` package, binding to a user-defined port (default 5683) and responding to configured routes.
2. **Dynamic Scripting Response Handler:** For each route, support writing custom JavaScript code running in a NodeJS sandbox (vm context) that Mutates/constructs the returned CoAP response (status, payload, options).
3. **Mock Server Configuration UI:** Add a new "Mock Server" tab in the left sidebar workspace selector. Show port setting, route CRUD table (Method, Path, and Editor), and Start/Stop toggle button.
4. **Workspace State Persistence:** Persist mock server port, routes, and script configurations in the `coap-workspace.json` file.

## Capabilities

### New Capabilities
- `coap-mock-server`: Define mock server execution, method/route matching, and sandboxed NodeJS script response rendering.

### Modified Capabilities
- `coap-client-ui`: Update sidebar tabs to add "Mock Server" and provide server status indicators and route editors.
- `coap-workspace-management`: Support loading and saving mock server states (port, status, list of routes) in the active workspace structure.

## Impact

- React renderer frontend (`App.jsx` layouts and state management for mock server).
- Electron Main process API (`mockServer.js` using `coap` package).
- Preload script (`preload/index.js` exposing start/stop/update IPC bindings).
