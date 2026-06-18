## ADDED Requirements

### Requirement: Bi-directional Query Parameters Synchronization
The system SHALL parse query parameters from the URL string and sync them to the query parameter key-value table automatically, and vice versa.

#### Scenario: Auto-sync URL query to params table
- **WHEN** the user types a query parameter `?host=localhost` in the URL input
- **THEN** the query parameter table adds a row with key `host` and value `localhost`.

#### Scenario: Auto-sync params table to URL query
- **WHEN** the user updates a query parameter key-value row
- **THEN** the URL query string is automatically updated to reflect the new parameters.
