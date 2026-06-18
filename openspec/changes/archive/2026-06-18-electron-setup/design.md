## Context

The repository is currently empty and requires a boilerplate setup for an Electron-based desktop application. To ensure a fast development experience and high-quality UI development, we will build the application using React for the frontend interface and Tailwind CSS for styling. The integration between the Electron processes (Main, Preload, Renderer) must follow security best practices.

## Goals / Non-Goals

**Goals:**
- Scaffolding a modern development workflow using Electron and Vite (`electron-vite`).
- Enabling context isolation and secure IPC communication via a preload script.
- Integrating React in the renderer process.
- Configuring Tailwind CSS for the React frontend.
- Providing a stylized welcome screen as the home page.

**Non-Goals:**
- Creating multi-window applications or complex routing systems.
- Integrating external APIs or database persistence.
- Packaging/distribution builds (e.g., producing `.dmg`, `.exe`, `.deb` installers), only verifying developer build processes.

## Decisions

### 1. Build and Process Tooling: `electron-vite`
- **Choice**: Use `electron-vite` to manage the bundle compilation and Dev Server.
- **Rationale**: Electron applications contain three distinct processes (Main, Preload, Renderer). `electron-vite` configures Vite instances for all three processes automatically, providing fast Hot Module Replacement (HMR) for the renderer and fast rebuilds for the main process.
- **Alternatives Considered**: Manual Webpack or single Vite configuration with custom node scripts. This requires significant configuration overhead and maintenance.

### 2. Renderer framework: React
- **Choice**: React.
- **Rationale**: High component reusability, rich ecosystem, and standard developer choice for web UI.

### 3. Styling: Tailwind CSS
- **Choice**: Tailwind CSS.
- **Rationale**: Speed of UI development using utility classes and easy responsiveness.
- **Integration**: Placed inside the renderer process package setup, compiling during Vite's bundle step.

### 4. Security: Context Isolation & Node Integration
- **Choice**: Set `contextIsolation: true` and `nodeIntegration: false` in the BrowserWindow configuration. Expose a minimal safe API in the preload script via `contextBridge.exposeInMainWorld`.
- **Rationale**: Prevents arbitrary code execution vulnerabilities in the renderer process.

## Risks / Trade-offs

### Context Bridge Overhead
- **Risk**: Adding communication channels between React and Electron requires writing IPC event handlers in both the main process and preload script.
- **Mitigation**: Standardize IPC message signatures and only expose what is strictly necessary. For the welcome screen, minimal communication is required.
