## ADDED Requirements

### Requirement: CoAP Standard Method Execution
The system SHALL execute standard CoAP request methods (GET, POST, PUT, DELETE) to a specified CoAP URL, sending URI query parameters, payloads, and custom CoAP headers (options).

#### Scenario: GET request completion
- **WHEN** the user triggers a GET request to a valid CoAP endpoint
- **THEN** the network client executes the request, returns the payload, and displays options.

### Requirement: CoAP Observe Subscription Streams
The system SHALL support the Observe option for GET requests, maintaining an open connection to stream updates from the server.

#### Scenario: Observe stream updates
- **WHEN** the user starts an Observe GET request
- **THEN** the client opens a subscription stream and appends received server notifications to a log.

### Requirement: Connection Cancellation
The system SHALL support aborting active CoAP requests or terminating active Observe streams on-the-fly.

#### Scenario: Cancel running request
- **WHEN** a CoAP request is active and the user clicks "Cancel"
- **THEN** the client aborts the network sockets and sets status to cancelled.
