# Purpose

This capability defines the user interface layout for the CoAP client, including the workspace/collection tree sidebar and the dual-panel request/response editor.

# Requirements

### Requirement: Sidebar Workspace Explorer Tree
The system SHALL display a sidebar containing a dropdown for selecting the workspace, a folder tree of collections, and a list of requests.

#### Scenario: Sidebar request selection
- **WHEN** the user clicks a request in the sidebar list
- **THEN** the application loads the selected request configuration into the active request panel.

### Requirement: Dual-Panel Request/Response Editor
The application SHALL render a workspace layout with a Request Editor panel (supporting method, URL, headers, script tabs, and payload) and a Response Panel (supporting body, options, and logs).

#### Scenario: Response panel rendering
- **WHEN** a request finishes successfully
- **THEN** the Response Panel displays the status, duration, response body, and an interactive list of returned CoAP options.

### Requirement: Sidebar Tab Navigation for Collections and Environments
The system SHALL display a toggle in the sidebar allowing the user to switch between the "Collections" explorer tree and the "Environments" configuration lists.

#### Scenario: Switching to Environments view
- **WHEN** the user selects the "Environments" tab in the sidebar
- **THEN** the sidebar displays the list of environments and their variables, replacing the collections tree.

### Requirement: Variable Hover Value Popup
The system SHALL display a tooltip popup containing the resolved value and source environment of a `{{variable-name}}` token when the user hovers over the variable pattern in an input field.

#### Scenario: Hovering variable token
- **WHEN** the cursor is positioned over `{{host}}` in the URL input
- **THEN** a tooltip overlays showing `host: coap.me (Active Environment)`.

### Requirement: Stacked and Resizable Panel Layout
The system SHALL display the Request editor panel stacked vertically above the Response panel, with draggable divider handles enabling panel resizes for both sidebar-to-main panels and request-to-response panels.

#### Scenario: Draggable Divider Resize
- **WHEN** the user drags the divider handles
- **THEN** the panel heights and widths are updated dynamically in real-time.

### Requirement: Autocomplete Suggestions for Variables
The system SHALL show a popover suggestion dropdown of active environment variables when typing `{{` in URL, options, query parameters, or payload fields, allowing selection.

#### Scenario: Auto-suggest variable selection
- **WHEN** the user types `{{` in the URL input
- **THEN** a dropdown lists available variables, and selecting one inserts the variable token `{{varName}}` into the input at cursor.

### Requirement: Rich Editor Look for Script Panels
The system SHALL render script textareas with an actual code editor look, including line numbers, code styling, and a NodeJS context reference list.

#### Scenario: Render code editor for scripts
- **WHEN** the pre-request script tab is active
- **THEN** a stylized container shows line numbers, code input, and a helper sidebar for sandbox variables.

### Requirement: Payload Type Format Selector
The system SHALL show selectors to choose between JSON and raw Text format for request payloads, adjusting options and syntax checking.

#### Scenario: Select JSON payload format
- **WHEN** the user selects the JSON payload tab and enters JSON
- **THEN** the system formats it and flags any syntax parsing issues.

### Requirement: Sidebar Mock Server View and Status Indicator
The system SHALL include a "Mock Server" tab inside the workspace explorer sidebar to configure routes, choose port, and toggle start/stop status.

#### Scenario: Toggle mock server run status
- **WHEN** the user clicks the "Start" button on the Mock Server panel
- **THEN** the status changes to "Running" and displays port configuration.
