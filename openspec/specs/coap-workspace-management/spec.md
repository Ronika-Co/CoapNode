# Purpose

This capability defines the workspace and collection persistence logic, ensuring workspaces, collections, and requests are saved in a local storage database file and loaded on startup.

# Requirements

### Requirement: Workspace and Collection Persistence
The system SHALL persist workspaces, collections, and requests in a local storage database file in the user's application data directory, loading them on application startup.

#### Scenario: Add a workspace
- **WHEN** the user clicks the "Create Workspace" button and inputs a workspace name
- **THEN** the workspace is created, saved to the database, and selected as active.

#### Scenario: Add a collection to a workspace
- **WHEN** the user clicks "Create Collection" inside a workspace and specifies a folder name
- **THEN** the collection folder is added to the active workspace tree in local storage.

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

