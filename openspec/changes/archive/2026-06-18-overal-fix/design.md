## Context

The current user interface layout of CoapNode consists of a side-by-side layout for collections and request settings, which leaves limited screen space for viewing long responses, logs, payloads, and CoAP options. Additionally, there is no drag-to-resize support, making it hard to adjust layouts on smaller or larger screens. Bi-directional sync of query parameters, payload format selectors, variable autocompletion, and an IDE-like editor for NodeJS scripts are essential for developer productivity.

## Goals / Non-Goals

**Goals:**
* Stack the Request and Response panels vertically (Request on top, Response at the bottom).
* Implement drag-to-resize handlers for the sidebar (width) and request/response panels (height).
* Implement bi-directional sync of query string parameter inputs and URL queries.
* Implement variable autocomplete lists showing when the user types `{{`.
* Support JSON and raw Text payload selections with syntax checks.
* Provide line numbers and editor UI styles for NodeJS pre/post scripts.

**Non-Goals:**
* Installing full Monaco/VSCode editor packages (which increases build complexity). We will implement a lightweight, styled textarea with synced gutter line numbers.

## Decisions

### 1. Panel Resizing Architecture
- **Choice**: Custom drag mouse event listeners tracking width/height in state.
- **Alternative**: Using libraries like `react-resizable` or `react-split-pane`.
- **Rationale**: Minimal code footprint, zero external dependencies, easily integrated directly into the custom styled Tailwind flex classes.

### 2. Autocomplete Suggestions Trigger
- **Choice**: Detect `{{` suffix matching on active inputs during `onChange`/`onKeyDown` and render a floating suggestion list.
- **Rationale**: Standard HTML inputs can be tracked by checking the input's `selectionStart` cursor position to find if the user is typing inside a `{{...}}` pattern.

### 3. NodeJS Script Editor
- **Choice**: Gutter component containing line numbers scrolling in lockstep with the textarea.
- **Rationale**: Keeps bundle sizes small while giving a true IDE aesthetic.

### 4. Bi-directional URL Parameters Sync
- **Choice**: Synchronize state dynamically. On URL change, parse queries using a robust regex. On param rows change, re-construct URL query string.
- **Rationale**: Avoids infinite loops by doing the parsing only on user interaction event handlers rather than continuous hook effects.

## Risks / Trade-offs

* **[Risk]** Heavy nested rendering scroll lag during resizing.
  * *Mitigation*: Use CSS variables or lightweight inline styles for resizable dimensions and optimize React render cycles.
* **[Risk]** Standard HTML inputs scroll synchronizations drift.
  * *Mitigation*: Ensure identical line-height, font-family, and padding for script textarea and line-number gutter container.
