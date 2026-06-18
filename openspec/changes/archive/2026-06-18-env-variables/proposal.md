## Why

Developers testing CoAP APIs across different environments (e.g., development, staging, production) need a way to reuse request templates without hardcoding values (such as hosts, ports, tokens). Implementing environment variables (`{{variable}}`) with sidebar switcher panels, hover previews, and custom script support provides parity with modern tools like Postman/Bruno.

## What Changes

- Create an Environment data store allowing users to manage multiple environments, each holding key-value variable mappings.
- Introduce a sidebar toggle to switch between the "Collections" view and the "Environments" view.
- Add an Environment selector dropdown to collections, setting the active environment context.
- Implement a placeholder resolver that replaces `{{variable}}` syntax in URLs, parameters, options, and payloads with active environment values before sending requests.
- Add hover overlays on `{{variable}}` string tokens in text fields to show their resolved values.
- **EDIT**: Do not add default collections/requests when initializing new workspaces.
- **EDIT**: Allow users to delete collections along with all nested requests.
- **EDIT**: Provide script verification and reference tips for Node.js language in the pre/post script panels.

## Capabilities

### New Capabilities
- `coap-environments`: Environment CRUD, variable definition, storage persistence, and switcher UI.
- `coap-variable-parser`: Interpolation engine resolving `{{variable}}` tokens before request execution, and hover tooltips on inputs.

### Modified Capabilities
- `coap-workspace-management`: Modified to support deleting collection nodes, and initializing empty workspaces.
- `coap-client-ui`: Modified to support sidebar tab views (Collections vs Environments), environment selections, and Node.js script reference tips.

## Impact

- **Storage**: Updates `coap-workspace.json` schema to store environments and variables alongside collections.
- **Renderer UI**: Adds tabs to the sidebar explorer, adds environment selectors in the header, introduces hover tooltips on inputs, and adds collection deletion buttons.
- **IPC Layer**: Resolves variables before passing request configs to the main process network engine.
