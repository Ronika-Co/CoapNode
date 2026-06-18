## ADDED Requirements

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
