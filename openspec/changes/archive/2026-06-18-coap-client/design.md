## Context

To build a CoAP testing client similar to Postman or Bruno, we need a backend capability to send and observe CoAP requests and a clean UI state machine in React to manage tabs, workspaces, collections, options, and logs. Security must be preserved by keeping direct network socket operations and script execution in the Electron main process, exposing safe IPC interfaces.

## Goals / Non-Goals

**Goals:**
- Implement workspace and collection tree navigation UI in React.
- Integrate the Node.js `coap` library in the main process.
- Implement an IPC bridge for GET, POST, PUT, DELETE CoAP requests, featuring request cancellation support.
- Implement GET Observe streaming support, updating the UI logs in real-time.
- Build a sandbox runtime using Node's `vm` module to run user pre/post request scripts safely.

**Non-Goals:**
- Designing cloud sync or shared remote team workspaces.
- Implementing highly complex script sandboxes with custom file/network IO permissions (keeps script access basic).

## Decisions

### 1. Network Layer: node-coap
- **Choice**: Use the `coap` package from npm.
- **Rationale**: `coap` is the standard Node.js CoAP client and server implementation. It supports standard UDP sockets, custom options headers, Observe subscription streams, and request aborting natively.

### 2. Workspace Storage: Local JSON File
- **Choice**: Simple JSON file storage (`workspaces.json`) managed by Node `fs/promises` in the main process.
- **Rationale**: Keeps workspaces, collections, and requests structured, highly portable, and extremely easy to backup/restore without database engine dependencies.

### 3. Script Sandbox: Node `vm` Module
- **Choice**: Execute pre-request and post-request scripts in a `vm.runInNewContext` environment.
- **Rationale**: Allows executing user JavaScript string payloads. By intercepting `console.log` calls and passing a custom context (`request` or `response`), we can allow developers to manipulate data securely in the main process before transmitting or displaying.
- **Security Note**: To protect the system, the sandbox context will only contain basic JS objects and a helper log array, excluding direct `require`, `process`, or `fs` access.

### 4. IPC Architecture
- We will define the following IPC events:
  - `coap:request` (Send CoAP message and get response)
  - `coap:observe` (Start streaming updates)
  - `coap:observe-update` (Server sent notification)
  - `coap:cancel` (Abort active request socket)
  - `storage:load` / `storage:save` (Workspace state management)

## Risks / Trade-offs

### Sandbox Escape via VM Module
- **Risk**: Node `vm` is not a secure sandbox and can be bypassed by advanced exploits if running untrusted code.
- **Mitigation**: Since the scripts are input directly by the local desktop developer themselves (similar to Postman/Bruno), they are running their own scripts. To guide them, we warn the user and sandbox the context variables.
