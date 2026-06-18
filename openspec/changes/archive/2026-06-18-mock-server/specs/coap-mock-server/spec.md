## ADDED Requirements

### Requirement: CoAP Mock Server Daemon Execution
The system SHALL manage a local mock CoAP server daemon that runs in the main process, starting and stopping on a configured local port (default 5683).

#### Scenario: Start mock server
- **WHEN** the user toggles the mock server to run on port 5683
- **THEN** the main process starts a CoAP listener on port 5683.

#### Scenario: Stop mock server
- **WHEN** the user toggles the running mock server to stop
- **THEN** the listener sockets are terminated cleanly.

### Requirement: Custom Sandboxed Route Execution
The system SHALL parse and dispatch incoming mock requests to corresponding routes based on path and method, executing custom script configurations in a NodeJS sandbox to construct the response.

#### Scenario: GET request matching route
- **WHEN** a CoAP GET request for `/temp` matches a configured route with a sandboxed response handler script
- **THEN** the sandbox script executes and returns the modified CoAP response payload, status, and options.
