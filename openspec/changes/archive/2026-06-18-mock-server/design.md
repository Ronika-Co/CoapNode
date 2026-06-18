## Context

Currently, testing CoAP clients requires setting up external CoAP servers (like `coap.me` or running standard node-coap scripts from terminal). This makes it harder to develop and debug custom scripts, mutations, options, and payloads locally in an isolated way.

## Goals / Non-Goals

**Goals:**
* Add a mock CoAP server running in the Electron main process.
* Support customizable port configurations (default 5683) and start/stop controls.
* Support route matching based on HTTP-like method (GET, POST, PUT, DELETE) and URL resource path.
* Support custom response handlers using NodeJS `vm` sandbox script context.
* Display real-time incoming request logs in the Mock Server UI console.
* Persist routes in the workspace configuration structure.

**Non-Goals:**
* Supporting multi-tenant/multiple running server instances simultaneously. Only one mock server instance can run at a time per workspace.

## Decisions

### 1. Mock Server Daemon in Main Process
- **Choice**: Implement `src/main/mockServer.js` wrapping the `coap` server listener, managing status variables in memory.
- **Rationale**: Isolates network listeners in the main process, avoiding sandbox constraint errors in renderer window process.

### 2. Route Handler NodeJS Sandbox API
- **Choice**: Execute route scripts in a `vm.runInNewContext` block.
- **Context bindings**:
  - `request`: `{ method: string, payload: string, options: array }`
  - `response`: `{ code: string, payload: string, options: array }`
  - `console.log`: Redirect to UI activity console log streams.
- **Rationale**: Reuses the proven sandbox framework developed for pre/post-scripts.

### 3. Workspace Configuration Integration
- **Choice**: Add `mockServer` (object containing `port` and `routes` array) properties into `coap-workspace.json`.
- **Rationale**: Makes it easy to share mock definitions together with client requests collections.

## Risks / Trade-offs

* **[Risk]** Port conflict on startup (e.g. port 5683 already in use).
  * *Mitigation*: Catch `EADDRINUSE` errors on binding server sockets and display user-friendly alert in UI.
* **[Risk]** Infinite loops or crashing scripts in mock route scripts.
  * *Mitigation*: Run VM contexts with strict `timeout` values (e.g., 1000ms).
