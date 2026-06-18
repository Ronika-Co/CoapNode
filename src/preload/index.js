import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,

  // Directory-based Storage CRUD API
  storage: {
    loadConfig: () => ipcRenderer.invoke('config:load'),
    saveConfig: (config) => ipcRenderer.invoke('config:save', config),
    selectDirectory: () => ipcRenderer.invoke('storage:select-directory'),
    loadWorkspace: (dirPath) => ipcRenderer.invoke('storage:load-workspace', dirPath),
    saveWorkspace: (dirPath, data) => ipcRenderer.invoke('storage:save-workspace', { dirPath, data })
  },

  // CoAP Client API
  coap: {
    send: (requestConfig) => ipcRenderer.invoke('coap:request', requestConfig),
    observe: (requestConfig, onUpdate) => {
      const subId = Math.random().toString(36).substring(2, 9)
      const callback = (_event, arg) => {
        if (arg.subId === subId) {
          onUpdate(arg.data)
        }
      }
      ipcRenderer.on('coap:observe-update', callback)
      ipcRenderer.invoke('coap:observe', { ...requestConfig, subId })

      return () => {
        ipcRenderer.off('coap:observe-update', callback)
        ipcRenderer.invoke('coap:cancel', { subId })
      }
    },
    cancel: (requestId) => ipcRenderer.invoke('coap:cancel', { requestId })
  }
})
