## ADDED Requirements

### Requirement: Workspace and Collection Persistence
The system SHALL persist workspaces, collections, and requests in a local storage database file in the user's application data directory, loading them on application startup.

#### Scenario: Add a workspace
- **WHEN** the user clicks the "Create Workspace" button and inputs a workspace name
- **THEN** the workspace is created, saved to the database, and selected as active.

#### Scenario: Add a collection to a workspace
- **WHEN** the user clicks "Create Collection" inside a workspace and specifies a folder name
- **THEN** the collection folder is added to the active workspace tree in local storage.
