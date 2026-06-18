# Purpose

This capability defines environment variable management for the CoAP client, enabling key-value variable mappings to be configured and stored.

# Requirements

### Requirement: Environment Variable Management
The system SHALL support creating, editing, and deleting environments, each containing key-value variable mappings persisted in local storage.

#### Scenario: Create a new environment
- **WHEN** the user creates an environment and names it "Staging"
- **THEN** the environment is added to the local configurations and selected as active.

#### Scenario: Delete an environment
- **WHEN** the user deletes the active environment
- **THEN** the environment and its associated variable mappings are deleted from local storage.
