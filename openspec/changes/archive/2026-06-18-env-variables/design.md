## Context

To make request settings flexible, we need to introduce environment variables. Variables are defined as key-value pairs grouped under active Environments. This design extends the storage schema, introduces a client-side parsing layer, and updates the sidebar layout in the React UI to support tab toggling, environment managers, and variable hover tooltips.

## Goals / Non-Goals

**Goals:**
- Update `coap-workspace.json` schema to serialize environments and variables list.
- Implement a sidebar panel in React for Environment CRUD (creation, editing, deletion of environments and variables).
- Implement a client-side placeholder resolver using regex to interpolate `{{variable}}` string tokens.
- Add absolute-positioned floating hover tooltips for variable preview.
- Ensure workspaces initialize empty by default (no sample folders/requests).
- Implement folder collection and workspace deletion support.

**Non-Goals:**
- Supporting nested environments or global/system-wide scopes (variables are scoped strictly to the selected environment).

## Decisions

### 1. Storage Schema Extension
- **Choice**: Extend the workspace JSON state:
  ```json
  {
    "id": "workspace-id",
    "name": "Workspace Name",
    "collections": [],
    "environments": [
      {
        "id": "env-id",
        "name": "Dev",
        "variables": [
          { "key": "host", "value": "127.0.0.1" }
        ]
      }
    ],
    "activeEnvironmentId": "env-id"
  }
  ```
- **Rationale**: Serializes variables inside the workspace directory directly, ensuring settings travel with the `coap-workspace.json` repository.

### 2. Rendering Tab Toggle
- **Choice**: Add an explorer view state in React: `sidebarTab` (`'collections'` | `'environments'`).
- **Rationale**: A toggle menu at the top of the sidebar explorer keeps the interface clean and separates request trees from configuration tables.

### 3. Client-Side Parsing Engine
- **Choice**: Interpolate request configuration values immediately prior to IPC invocation.
- **Rationale**: Keeps the Electron main process network sockets layer completely stateless. The renderer process resolves variables using a simple regex: `/\{\{([^}]+)\}\}/g`.

### 4. Hover Previews
- **Choice**: Use a custom wrapper component or basic cursor mouse-over listeners to parse active variables and show tooltip elements.
- **Rationale**: Helps developers verify variable bindings on-screen prior to sending request calls.

## Risks / Trade-offs

### Raw Payload Replacements
- **Risk**: Replacing variables inside JSON payloads might break formatting if the user variables are not clean.
- **Mitigation**: Perform direct string replacements. Developers are responsible for syntax correctness.
