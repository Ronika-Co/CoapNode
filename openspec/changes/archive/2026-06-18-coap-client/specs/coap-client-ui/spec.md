## ADDED Requirements

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
