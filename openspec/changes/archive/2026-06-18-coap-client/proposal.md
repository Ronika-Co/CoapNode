## Why

Developers working with Constrained Application Protocol (CoAP) lack standard visual tools like Postman or Bruno to test, debug, and organize CoAP API endpoints. Building a CoAP desktop client inside our Electron environment with workspaces, collections, observe support, request cancellation, and scripting solves this gap and improves developer experience.

## What Changes

- Implement a multi-level data hierarchy: Workspaces contain Collections, and Collections contain CoAP Request objects.
- Create a sidebar navigation component for workspaces and collection trees.
- Integrate a robust CoAP client engine in the Electron main process, exposing APIs to the renderer for GET, POST, PUT, DELETE requests, request cancellation, and Observe subscriptions.
- Implement UI panels in the React renderer for request editing (URL, method, query/URI params, CoAP options headers) and response viewing.
- Implement a scripting environment using Node.js in the main process to execute user-defined pre-request and post-request scripts before sending or after receiving CoAP messages.

## Capabilities

### New Capabilities
- `coap-workspace-management`: Workspace and collection CRUD operations, local persistence, and sidebar navigation.
- `coap-request-engine`: Network request execution supporting GET, POST, PUT, DELETE, cancellation, CoAP options, and GET Observe subscription streams.
- `coap-script-runner`: main process sandboxed runtime for executing pre-request and post-request scripting.
- `coap-client-ui`: Workspace explorer, dual-panel request/response screen, param/option tables, and observer log display.

### Modified Capabilities
<!-- None -->

## Impact

- **Dependencies**: Introduces CoAP library (such as `node-coap` or `coap`) to the backend.
- **Main Process APIs**: Introduces IPC handlers for managing database collections, executing CoAP client commands, and running scripts.
- **Renderer UI**: Creates a rich tabbed interface with input tables, syntax highlighters (for response bodies/scripts), and observing panels.
