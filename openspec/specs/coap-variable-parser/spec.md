# Purpose

This capability defines request parameter variable interpolation, allowing dynamic variable substitution in request configurations.

# Requirements

### Requirement: Request Parameter Variable Interpolation
The system SHALL parse request settings (URL, query params, options, payload) and substitute any `{{variable-name}}` patterns with their active values before request execution.

#### Scenario: Interpolating variable in URL
- **WHEN** the user inputs `coap://{{ip}}/resource` and the active environment has `ip` set to `127.0.0.1`
- **THEN** the request engine executes the request against `coap://127.0.0.1/resource`.

### Requirement: Bi-directional Query Parameters Synchronization
The system SHALL parse query parameters from the URL string and sync them to the query parameter key-value table automatically, and vice versa.

#### Scenario: Auto-sync URL query to params table
- **WHEN** the user types a query parameter `?host=localhost` in the URL input
- **THEN** the query parameter table adds a row with key `host` and value `localhost`.

#### Scenario: Auto-sync params table to URL query
- **WHEN** the user updates a query parameter key-value row
- **THEN** the URL query string is automatically updated to reflect the new parameters.

