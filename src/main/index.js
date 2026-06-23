import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { loadGlobalConfig, saveGlobalConfig, loadWorkspaceFromDir, saveWorkspaceToDir } from './storage.js'
import { sendCoapRequest, startObserveStream, cancelRequest } from './coapEngine.js'
import { startMockServer, stopMockServer, getMockServerStatus, updateMockServerRoutes, updateMockServerEnv } from './mockServer.js'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Config and storage IPC handlers
  ipcMain.handle('config:load', () => loadGlobalConfig())
  ipcMain.handle('config:save', (_event, config) => saveGlobalConfig(config))

  ipcMain.handle('storage:select-directory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose Workspace Location',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('storage:load-workspace', (_event, dirPath) => loadWorkspaceFromDir(dirPath))
  ipcMain.handle('storage:save-workspace', (_event, { dirPath, data }) => saveWorkspaceToDir(dirPath, data))

  // CoAP Request IPC handlers
  ipcMain.handle('coap:request', (_event, config) => sendCoapRequest(config))
  ipcMain.handle('coap:observe', (event, args) => {
    const { subId } = args
    startObserveStream(args, subId, event.sender)
  })
  ipcMain.handle('coap:cancel', (_event, { subId, requestId }) => {
    return cancelRequest(subId || requestId)
  })

  // Mock Server IPC handlers
  ipcMain.handle('mock-server:start', (event, { port, routes, env }) => startMockServer(port, routes, event.sender, env))
  ipcMain.handle('mock-server:stop', () => stopMockServer())
  ipcMain.handle('mock-server:status', () => getMockServerStatus())
  ipcMain.handle('mock-server:update-routes', (_event, { routes }) => {
    updateMockServerRoutes(routes)
    return true
  })
  ipcMain.handle('mock-server:update-env', (_event, { env }) => {
    updateMockServerEnv(env)
    return true
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async function () {
  await stopMockServer()
  if (process.platform !== 'darwin') app.quit()
})
