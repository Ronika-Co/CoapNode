# Purpose

This capability defines the execution of custom Node.js scripts both before a CoAP request is sent and after a CoAP response is received, allowing modification or logging of CoAP data.

# Requirements

### Requirement: Pre-Request Script Execution
The system SHALL run a custom Node.js script before executing a CoAP request, exposing request parameters (URL, payload, options) for modification or logging.

#### Scenario: Script payload mutation
- **WHEN** a pre-request script is configured to modify the request payload and the request is sent
- **THEN** the script execution runs in Node.js first, updates the payload, and sends the modified payload over the wire.

### Requirement: Post-Request Script Execution
The system SHALL run a custom Node.js script after a CoAP response is received, exposing the response payload and options.

#### Scenario: Response logging
- **WHEN** a response is returned and a post-request script is configured to print the response body
- **THEN** the script executes and outputs the printed messages to a script console log.
