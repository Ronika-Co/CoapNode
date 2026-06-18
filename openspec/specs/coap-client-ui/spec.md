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

