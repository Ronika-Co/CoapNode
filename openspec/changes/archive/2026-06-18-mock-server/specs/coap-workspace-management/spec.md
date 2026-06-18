## ADDED Requirements

### Requirement: Mock Server Routes Persistence
The system SHALL store mock server port and routes configuration inside the active workspace JSON tree configurations.

#### Scenario: Workspace mock server routes save
- **WHEN** the user adds or modifies routes or updates port configuration
- **THEN** the configurations are serialized to `coap-workspace.json`.
