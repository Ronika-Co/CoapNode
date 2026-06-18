## ADDED Requirements

### Requirement: Request Parameter Variable Interpolation
The system SHALL parse request settings (URL, query params, options, payload) and substitute any `{{variable-name}}` patterns with their active values before request execution.

#### Scenario: Interpolating variable in URL
- **WHEN** the user inputs `coap://{{ip}}/resource` and the active environment has `ip` set to `127.0.0.1`
- **THEN** the request engine executes the request against `coap://127.0.0.1/resource`.
