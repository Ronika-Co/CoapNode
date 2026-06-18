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
  },

  // Mock Server API
  mockServer: {
    start: (port, routes) => ipcRenderer.invoke('mock-server:start', { port, routes }),
    stop: () => ipcRenderer.invoke('mock-server:stop'),
    status: () => ipcRenderer.invoke('mock-server:status'),
    updateRoutes: (routes) => ipcRenderer.invoke('mock-server:update-routes', { routes }),
    onRequestReceived: (onReceive) => {
      const listener = (_event, arg) => onReceive(arg)
      ipcRenderer.on('mock-server:request-received', listener)
      return () => ipcRenderer.off('mock-server:request-received', listener)
    },
    onScriptLogs: (onLogs) => {
      const listener = (_event, arg) => onLogs(arg)
      ipcRenderer.on('mock-server:script-logs', listener)
      return () => ipcRenderer.off('mock-server:script-logs', listener)
    },
    onError: (onErrorMsg) => {
      const listener = (_event, arg) => onErrorMsg(arg)
      ipcRenderer.on('mock-server:error', listener)
      return () => ipcRenderer.off('mock-server:error', listener)
    }
  }
})
