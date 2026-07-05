# CoapNode - [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ronika-Co/CoapNode)

CoapNode is an advanced desktop client for the CoAP (Constrained Application Protocol), built with Electron, React, and Tailwind CSS. It provides a modern interface to construct and send CoAP requests, manage workspaces, environments, and mock servers.

<img width="1920" height="1034" alt="CoapNode" src="https://github.com/user-attachments/assets/775e71c5-ecf6-4d5b-a570-4f6357997fa1" />


## Features

- **CoAP Client**: Construct, send, and analyze CoAP requests and responses.
- **Workspace Management**: Organize your work into workspaces and collections.
- **Environments & Variables**: Use dynamic variables in your requests with environment configurations.
- **Mock Server**: Built-in CoAP mock server with custom route execution and sandboxed scripting.
- **Rich Editor**: Code editors for scripts and payloads with autocomplete and syntax highlighting.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Run Locally

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CoapNode
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Building from Source

To build the project for your operating system:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the app using electron-builder:
   ```bash
   npm run build
   ```
This will compile the application and generate executables in the `dist/` directory. Currently, it supports Windows (NSIS, portable) and Linux (AppImage).

## Installation and Using Releases

You can download the pre-compiled binaries from the [Releases](../../releases) page.

**Linux (AppImage)**
1. Download the `.AppImage` file from the latest release.
2. Make it executable: `chmod +x CoapNode-x.x.x.AppImage`
3. Run the file: `./CoapNode-x.x.x.AppImage`

**Windows**
1. Download the `.exe` installer from the latest release.
2. Run the installer and follow the instructions.
