import { contextBridge } from 'electron'

// Exposing safe platform versions to the renderer process
contextBridge.exposeInMainWorld('api', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})
