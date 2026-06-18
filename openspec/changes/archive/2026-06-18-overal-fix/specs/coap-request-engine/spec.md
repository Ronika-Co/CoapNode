## ADDED Requirements

### Requirement: Content-Type Formatted Payload Serialization
The system SHALL serialize payloads according to their selected payload type (e.g. JSON vs Plain Text) and attach the corresponding Content-Format option to the CoAP request message before transmission.

#### Scenario: Send JSON payload
- **WHEN** the user triggers a request with a JSON payload
- **THEN** the engine serializes it and sets Content-Format option to `application/json` (50).
