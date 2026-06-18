import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

// Path to store global configuration (e.g., last opened workspace path)
const getGlobalConfigPath = () => {
  try {
    return join(app.getPath('userData'), 'coap-client-config.json')
  } catch (e) {
    return join(process.cwd(), 'coap-client-config.json')
  }
}

// Default workspace structure for a newly created directory
const getInitialWorkspaceState = (name = 'New CoAP Workspace') => ({
  id: Math.random().toString(),
  name: name,
  collections: [],
  environments: [],
  activeEnvironmentId: '',
  mockPort: 5683,
  mockRoutes: []
})

// Load global configuration
export async function loadGlobalConfig() {
  const filePath = getGlobalConfigPath()
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      const defaultConfig = { lastWorkspacePath: '', recentPaths: [] }
      await saveGlobalConfig(defaultConfig)
      return defaultConfig
    }
    throw error
  }
}

// Save global configuration
export async function saveGlobalConfig(config) {
  const filePath = getGlobalConfigPath()
  await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8')
  return true
}

// Load workspace from a custom local folder
export async function loadWorkspaceFromDir(dirPath) {
  const filePath = join(dirPath, 'coap-workspace.json')
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If coap-workspace.json does not exist in folder, return a new initial structure
      const folderName = dirPath.split(/[/\\]/).pop() || 'Workspace'
      const initialState = getInitialWorkspaceState(folderName)
      await saveWorkspaceToDir(dirPath, initialState)
      return initialState
    }
    throw error
  }
}

// Save workspace to a custom local folder
export async function saveWorkspaceToDir(dirPath, data) {
  const filePath = join(dirPath, 'coap-workspace.json')
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return true
}
