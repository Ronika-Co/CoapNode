## ADDED Requirements

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
