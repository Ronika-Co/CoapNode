## ADDED Requirements

### Requirement: Workspace Initialization without Defaults
The system SHALL initialize newly created workspace directory files without any pre-defined collections or requests, presenting a clean workspace view.

#### Scenario: New workspace loaded
- **WHEN** the user creates a workspace directory that doesn't have a coap-workspace.json file
- **THEN** the workspace is created with zero collections and zero requests.

### Requirement: Collection and Request Deletion
The system SHALL allow deleting a collection, which removes it along with all requests nested inside it.

#### Scenario: Delete a collection
- **WHEN** the user triggers deletion on a collection folder
- **THEN** the collection and its nested requests are removed from the workspace structure and storage file.
