import React, { useState, useEffect } from 'react'

// Custom Dialog/Modal Component to replace window.prompt()
function InputModal({ isOpen, onClose, onSubmit, title, placeholder, initialValue = '' }) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (isOpen) setValue(initialValue)
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-96 max-w-full shadow-2xl flex flex-col gap-4 animate-scale-up">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
          }}
        />
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={() => {
              setValue('')
              onClose()
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  // Global configuration
  const [globalConfig, setGlobalConfig] = useState({ lastWorkspacePath: '', recentPaths: [] })
  const [activeWorkspacePath, setActiveWorkspacePath] = useState('')
  const [workspaceData, setWorkspaceData] = useState(null)
  
  // Active request configs
  const [activeRequestId, setActiveRequestId] = useState('')
  const [activeReqConfig, setActiveReqConfig] = useState(null)
  
  // Active environment configs
  const [activeEnvId, setActiveEnvId] = useState('')

  // UI Tabs & States
  const [sidebarTab, setSidebarTab] = useState('collections') // 'collections' | 'environments'
  const [requestTab, setRequestTab] = useState('params') // 'params' | 'options' | 'body' | 'preScript' | 'postScript'
  const [responseTab, setResponseTab] = useState('body') // 'body' | 'options' | 'observe' | 'logs'
  const [isRequesting, setIsRequesting] = useState(false)
  const [isObserving, setIsObserving] = useState(false)
  const [observeTeardown, setObserveTeardown] = useState(null)
  const [bindToMockPort, setBindToMockPort] = useState(false)

  // Floating hover variables tooltip state
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0, isError: false })

  // Custom Modal States
  const [modalType, setModalType] = useState('') // 'collection' | 'request' | 'env' | ''
  const [modalTargetId, setModalTargetId] = useState('') 
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Response & Logs States
  const [response, setResponse] = useState(null)
  const [scriptLogs, setScriptLogs] = useState([])
  const [observeLogs, setObserveLogs] = useState([])
  const [errorText, setErrorText] = useState('')

  // Mock Server States
  const [isMockRunning, setIsMockRunning] = useState(false)
  const [activeRouteId, setActiveRouteId] = useState('')
  const [mockActivityLogs, setMockActivityLogs] = useState([])
  const [mockConsoleLogs, setMockConsoleLogs] = useState([])
  const [mockLogsTab, setMockLogsTab] = useState('activity') // 'activity' | 'console'

  // Active mock route config
  const activeRoute = workspaceData?.mockRoutes?.find(r => r.id === activeRouteId) || null

  // Resizable layout states
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [requestHeight, setRequestHeight] = useState(400)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isResizingRequest, setIsResizingRequest] = useState(false)

  // Gutters refs for script scroll sync
  const preScriptGutterRef = React.useRef(null)
  const preScriptTextareaRef = React.useRef(null)
  const postScriptGutterRef = React.useRef(null)
  const postScriptTextareaRef = React.useRef(null)
  const mockRouteScriptGutterRef = React.useRef(null)
  const mockRouteScriptTextareaRef = React.useRef(null)

  // Variables Autocomplete state
  const [suggestion, setSuggestion] = useState({
    show: false,
    list: [],
    x: 0,
    y: 0,
    targetInput: null,
    cursorPosition: 0,
    braceIndex: -1,
    query: '',
    activeIndex: 0
  })

  // Load configuration on mount
  useEffect(() => {
    window.api.storage.loadConfig().then((config) => {
      setGlobalConfig(config)
      if (config.lastWorkspacePath) {
        handleOpenWorkspace(config.lastWorkspacePath, config)
      }
    })
  }, [])

  // Mock Server listeners and state sync
  useEffect(() => {
    let unsubs = []

    if (workspaceData) {
      window.api.mockServer.status().then((status) => {
        setIsMockRunning(status.running)
      })

      const unsubRequest = window.api.mockServer.onRequestReceived((req) => {
        setMockActivityLogs(prev => [req, ...prev].slice(0, 100))
      })
      const unsubLogs = window.api.mockServer.onScriptLogs((logItem) => {
        setMockConsoleLogs(prev => [logItem, ...prev].slice(0, 100))
      })
      const unsubError = window.api.mockServer.onError((errorMsg) => {
        setErrorText(`Mock Server Error: ${errorMsg}`)
        setIsMockRunning(false)
      })

      unsubs = [unsubRequest, unsubLogs, unsubError]
    }

    return () => {
      unsubs.forEach(unsub => unsub())
    }
  }, [workspaceData])

  // Find active request inside the active workspace
  useEffect(() => {
    if (!workspaceData) {
      setActiveReqConfig(null)
      return
    }
    
    let foundReq = null
    for (const col of workspaceData.collections) {
      const r = col.requests.find(req => req.id === activeRequestId)
      if (r) {
        foundReq = JSON.parse(JSON.stringify(r)) // deep copy
        break
      }
    }
    
    if (foundReq) {
      setActiveReqConfig(foundReq)
    } else {
      setActiveReqConfig(null)
    }
  }, [activeRequestId, workspaceData])

  // Mouse drag listeners for resizers
  const startResizeSidebar = (e) => {
    e.preventDefault()
    setIsResizingSidebar(true)
  }

  const startResizeRequest = (e) => {
    e.preventDefault()
    setIsResizingRequest(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(e.clientX, 600))
        setSidebarWidth(newWidth)
      } else if (isResizingRequest) {
        const mainElement = document.getElementById('main-panel-container')
        if (mainElement) {
          const rect = mainElement.getBoundingClientRect()
          const newHeight = Math.max(150, Math.min(e.clientY - rect.top, rect.height - 150))
          setRequestHeight(newHeight)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizingSidebar(false)
      setIsResizingRequest(false)
    }

    if (isResizingSidebar || isResizingRequest) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingSidebar, isResizingRequest])

  // Get current active environment variables
  const getActiveEnvironment = () => {
    if (!workspaceData || !workspaceData.activeEnvironmentId) return null
    return (workspaceData.environments || []).find(e => e.id === workspaceData.activeEnvironmentId)
  }

  // Regex string interpolation function
  const resolveVariables = (text) => {
    if (typeof text !== 'string') return text
    const activeEnv = getActiveEnvironment()
    if (!activeEnv) return text
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const varName = key.trim()
      const found = (activeEnv.variables || []).find(v => v.key === varName)
      return found ? found.value : match
    })
  }

  const isValidJson = (str) => {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  const safeEncode = (str) => {
    if (typeof str !== 'string') return ''
    let encoded = encodeURIComponent(str)
    encoded = encoded.replace(/%7B%7B/g, '{{').replace(/%7D%7D/g, '}}')
    return encoded
  }

  const safeDecode = (str) => {
    if (typeof str !== 'string') return ''
    let prepared = str.replace(/%7B%7B/gi, '{{').replace(/%7D%7D/gi, '}}')
    try {
      return decodeURIComponent(prepared)
    } catch (e) {
      return prepared
    }
  }

  const parseQueryParamsFromUrl = (urlString) => {
    try {
      const qIndex = urlString.indexOf('?')
      if (qIndex === -1) return []
      const queryString = urlString.substring(qIndex + 1)
      if (!queryString) return []
      return queryString.split('&').map(pair => {
        const [key, ...valParts] = pair.split('=')
        return {
          key: safeDecode(key || ''),
          value: safeDecode(valParts.join('=') || '')
        }
      }).filter(p => p.key !== '')
    } catch (e) {
      console.error(e)
      return []
    }
  }

  const buildUrlWithParams = (baseUrl, params) => {
    const qIndex = baseUrl.indexOf('?')
    const base = qIndex === -1 ? baseUrl : baseUrl.substring(0, qIndex)
    const activeParams = (params || []).filter(p => p.key.trim() !== '')
    if (activeParams.length === 0) return base
    const queryString = activeParams.map(p => `${safeEncode(p.key)}=${safeEncode(p.value)}`).join('&')
    return `${base}?${queryString}`
  }

  // Check input autocomplete triggers when typing {{
  const checkAutocompleteTrigger = (e, val) => {
    const cursor = e.target.selectionStart
    const textBeforeCursor = val.substring(0, cursor)
    const lastBraces = textBeforeCursor.lastIndexOf('{{')
    if (lastBraces !== -1 && lastBraces > textBeforeCursor.lastIndexOf('}}')) {
      const varQuery = textBeforeCursor.substring(lastBraces + 2).trim()
      const activeEnv = getActiveEnvironment()
      const allVars = activeEnv ? (activeEnv.variables || []) : []
      const filtered = allVars.filter(v => v.key.toLowerCase().includes(varQuery.toLowerCase()))
      
      const rect = e.target.getBoundingClientRect()
      
      setSuggestion({
        show: true,
        list: filtered,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 4,
        targetInput: e.target,
        cursorPosition: cursor,
        braceIndex: lastBraces,
        query: varQuery,
        activeIndex: 0
      })
    } else {
      setSuggestion(prev => ({ ...prev, show: false }))
    }
  }

  const handleInputKeyDown = (e) => {
    if (!suggestion.show || suggestion.list.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestion(prev => ({
        ...prev,
        activeIndex: (prev.activeIndex + 1) % prev.list.length
      }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestion(prev => ({
        ...prev,
        activeIndex: (prev.activeIndex - 1 + prev.list.length) % prev.list.length
      }))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      insertSelectedSuggestion(suggestion.list[suggestion.activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSuggestion(prev => ({ ...prev, show: false }))
    }
  }

  const insertSelectedSuggestion = (variable) => {
    if (!suggestion.targetInput || !variable) return
    const input = suggestion.targetInput
    const val = input.value
    const braceIndex = suggestion.braceIndex
    const cursor = suggestion.cursorPosition
    
    const before = val.substring(0, braceIndex)
    const after = val.substring(cursor)
    const inserted = `{{${variable.key}}}`
    const newValue = before + inserted + after
    
    const fieldType = input.getAttribute('data-field-type')
    const rowIndex = parseInt(input.getAttribute('data-row-index') || '-1')
    const fieldKey = input.getAttribute('data-field-key')
    
    if (fieldType === 'url') {
      handleUpdateReqField('url', newValue)
    } else if (fieldType === 'payload') {
      handleUpdateReqField('payload', newValue)
    } else if (fieldType === 'queryParams' || fieldType === 'headers') {
      const list = [...(activeReqConfig[fieldType] || [])]
      if (list[rowIndex]) {
        list[rowIndex][fieldKey] = newValue
        handleUpdateReqField(fieldType, list)
      }
    }
    
    setTimeout(() => {
      input.focus()
      const newCursorPos = braceIndex + inserted.length
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 10)
    
    setSuggestion({ show: false, list: [], x: 0, y: 0, targetInput: null, cursorPosition: 0, activeIndex: 0 })
  }

  // Interpolate full request config before send
  const interpolateRequestConfig = (config) => {
    let headers = (config.headers || []).map(h => ({
      key: resolveVariables(h.key),
      value: resolveVariables(h.value)
    }))

    if (config.payloadType === 'json') {
      const hasContentFormat = headers.some(h => h.key.toLowerCase() === 'content-format')
      if (!hasContentFormat) {
        headers.push({ key: 'Content-Format', value: '50' })
      }
    }

    return {
      ...config,
      url: resolveVariables(config.url),
      queryParams: [],
      headers,
      payload: resolveVariables(config.payload)
    }
  }

  // Handle Input Hover tooltip check
  const handleInputHover = (e, val) => {
    if (typeof val !== 'string') return
    const matches = val.match(/\{\{([^}]+)\}\}/)
    if (matches) {
      const varName = matches[1].trim()
      const activeEnv = getActiveEnvironment()
      const found = activeEnv ? (activeEnv.variables || []).find(v => v.key === varName) : null
      const rect = e.target.getBoundingClientRect()
      
      setTooltip({
        show: true,
        text: activeEnv 
          ? (found ? `${varName}: "${found.value}" (${activeEnv.name})` : `{{${varName}}} (Undefined in ${activeEnv.name})`)
          : `{{${varName}}} (No Environment selected)`,
        isError: !found,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 6
      })
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })
    }
  }

  // Open directory workspace
  const handleOpenWorkspace = async (dirPath, currentConfig = globalConfig) => {
    if (!dirPath) return
    try {
      const wsData = await window.api.storage.loadWorkspace(dirPath)
      
      // Upgrade schema in memory in case it misses environments properties
      if (!wsData.environments) wsData.environments = []
      if (!wsData.activeEnvironmentId) wsData.activeEnvironmentId = ''
      if (wsData.mockPort === undefined) wsData.mockPort = 5683
      if (!wsData.mockRoutes) wsData.mockRoutes = []

      setWorkspaceData(wsData)
      setActiveWorkspacePath(dirPath)
      
      // Update global configs
      const updatedRecents = [dirPath, ...currentConfig.recentPaths.filter(p => p !== dirPath)].slice(0, 5)
      const updatedConfig = {
        lastWorkspacePath: dirPath,
        recentPaths: updatedRecents
      }
      setGlobalConfig(updatedConfig)
      await window.api.storage.saveConfig(updatedConfig)
    } catch (e) {
      setErrorText(`Failed to load workspace from ${dirPath}: ${e.message}`)
    }
  }

  // Trigger folder picker dialog
  const handleSelectDirectory = async () => {
    const selectedDir = await window.api.storage.selectDirectory()
    if (selectedDir) {
      handleOpenWorkspace(selectedDir)
    }
  }

  // Save workspace changes to local directory
  const saveWorkspaceState = async (updatedData) => {
    setWorkspaceData(updatedData)
    if (activeWorkspacePath) {
      await window.api.storage.saveWorkspace(activeWorkspacePath, updatedData)
    }
  }

  // Close active workspace directory
  const handleCloseWorkspace = async () => {
    if (observeTeardown) observeTeardown()
    setIsObserving(false)
    setObserveTeardown(null)
    setWorkspaceData(null)
    setActiveWorkspacePath('')
    setActiveRequestId('')
    setResponse(null)
    setIsMockRunning(false)
    setActiveRouteId('')
    setMockActivityLogs([])
    setMockConsoleLogs([])
    await window.api.mockServer.stop()

    const updatedConfig = {
      ...globalConfig,
      lastWorkspacePath: ''
    }
    setGlobalConfig(updatedConfig)
    await window.api.storage.saveConfig(updatedConfig)
  }

  // Clear recents
  const handleClearRecents = async () => {
    const updatedConfig = {
      ...globalConfig,
      recentPaths: []
    }
    setGlobalConfig(updatedConfig)
    await window.api.storage.saveConfig(updatedConfig)
  }

  // Add Collection
  const handleAddCollection = (name) => {
    if (!workspaceData) return
    const newCol = {
      id: Math.random().toString(),
      name,
      requests: []
    }
    const updated = {
      ...workspaceData,
      collections: [...(workspaceData.collections || []), newCol]
    }
    saveWorkspaceState(updated)
  }

  // Delete Collection folder (removes folders and nested requests)
  const handleDeleteCollection = (colId) => {
    if (!confirm('Are you sure you want to delete this folder collection and all its requests?')) return
    const colToDelete = workspaceData.collections.find(c => c.id === colId)
    const isEditingDeleted = colToDelete?.requests.some(r => r.id === activeRequestId)

    const updated = {
      ...workspaceData,
      collections: workspaceData.collections.filter(c => c.id !== colId)
    }
    saveWorkspaceState(updated)
    if (isEditingDeleted) {
      setActiveRequestId('')
    }
  }

  // Add Request
  const handleAddRequest = (name) => {
    if (!workspaceData || !modalTargetId) return
    const newReq = {
      id: Math.random().toString(),
      name,
      url: 'coap://localhost:5683/',
      method: 'GET',
      queryParams: [],
      headers: [],
      payload: '',
      payloadType: 'text',
      preScript: '',
      postScript: ''
    }
    const updatedCols = workspaceData.collections.map(c => {
      if (c.id === modalTargetId) {
        return { ...c, requests: [...(c.requests || []), newReq] }
      }
      return c
    })
    const updated = {
      ...workspaceData,
      collections: updatedCols
    }
    saveWorkspaceState(updated)
    setActiveRequestId(newReq.id)
  }

  // Delete Request
  const handleDeleteRequest = (colId, reqId) => {
    if (!confirm('Are you sure you want to delete this request?')) return
    const updatedCols = workspaceData.collections.map(c => {
      if (c.id === colId) {
        return { ...c, requests: c.requests.filter(r => r.id !== reqId) }
      }
      return c
    })
    const updated = {
      ...workspaceData,
      collections: updatedCols
    }
    saveWorkspaceState(updated)
    if (activeRequestId === reqId) {
      setActiveRequestId('')
    }
  }

  // Add Environment
  const handleAddEnvironment = (name) => {
    if (!workspaceData) return
    const newEnv = {
      id: Math.random().toString(),
      name,
      variables: []
    }
    const updated = {
      ...workspaceData,
      environments: [...(workspaceData.environments || []), newEnv],
      activeEnvironmentId: workspaceData.activeEnvironmentId || newEnv.id
    }
    saveWorkspaceState(updated)
    setActiveEnvId(newEnv.id)
  }

  // Delete Environment
  const handleDeleteEnvironment = (envId) => {
    if (!confirm('Are you sure you want to delete this environment?')) return
    const updatedEnvs = (workspaceData.environments || []).filter(e => e.id !== envId)
    const nextActive = workspaceData.activeEnvironmentId === envId 
      ? (updatedEnvs.length > 0 ? updatedEnvs[0].id : '') 
      : workspaceData.activeEnvironmentId

    const updated = {
      ...workspaceData,
      environments: updatedEnvs,
      activeEnvironmentId: nextActive
    }
    saveWorkspaceState(updated)
    if (activeEnvId === envId) {
      setActiveEnvId(updatedEnvs.length > 0 ? updatedEnvs[0].id : '')
    }
  }

  // Update active environment ID
  const handleSetActiveEnvironment = (envId) => {
    saveWorkspaceState({
      ...workspaceData,
      activeEnvironmentId: envId
    })
  }

  // Update variables within an environment
  const handleUpdateEnvVariables = (envId, variables) => {
    const updatedEnvs = workspaceData.environments.map(e => {
      if (e.id === envId) {
        return { ...e, variables }
      }
      return e
    })
    saveWorkspaceState({
      ...workspaceData,
      environments: updatedEnvs
    })
  }

  // Toggle Mock Server running state
  const handleToggleMockServer = async () => {
    if (isMockRunning) {
      try {
        await window.api.mockServer.stop()
        setIsMockRunning(false)
      } catch (e) {
        setErrorText(`Failed to stop mock server: ${e.message}`)
      }
    } else {
      try {
        const port = workspaceData.mockPort || 5683
        const routes = workspaceData.mockRoutes || []
        await window.api.mockServer.start(port, routes)
        setIsMockRunning(true)
      } catch (e) {
        setErrorText(`Failed to start mock server: ${e.message}`)
      }
    }
  }

  // Add Mock Route
  const handleAddMockRoute = (path) => {
    if (!workspaceData) return
    const formattedPath = '/' + path.replace(/^\//, '')
    const newRoute = {
      id: Math.random().toString(),
      method: 'GET',
      path: formattedPath,
      script: `// Mock Response Script\nresponse.code = '2.05';\nresponse.payload = 'Hello from CoAP Mock Server!';\n`
    }
    const updatedRoutes = [...(workspaceData.mockRoutes || []), newRoute]
    const updated = {
      ...workspaceData,
      mockRoutes: updatedRoutes
    }
    saveWorkspaceState(updated)
    setActiveRouteId(newRoute.id)
    if (isMockRunning) {
      window.api.mockServer.updateRoutes(updatedRoutes)
    }
  }

  // Delete Mock Route
  const handleDeleteMockRoute = (routeId) => {
    if (!confirm('Are you sure you want to delete this mock route?')) return
    const updatedRoutes = (workspaceData.mockRoutes || []).filter(r => r.id !== routeId)
    const updated = {
      ...workspaceData,
      mockRoutes: updatedRoutes
    }
    saveWorkspaceState(updated)
    if (activeRouteId === routeId) {
      setActiveRouteId('')
    }
    if (isMockRunning) {
      window.api.mockServer.updateRoutes(updatedRoutes)
    }
  }

  // Update Mock Route
  const handleUpdateMockRoute = (routeId, fields) => {
    const updatedRoutes = (workspaceData.mockRoutes || []).map(r => {
      if (r.id === routeId) {
        return { ...r, ...fields }
      }
      return r
    })
    saveWorkspaceState({
      ...workspaceData,
      mockRoutes: updatedRoutes
    })
    if (isMockRunning) {
      window.api.mockServer.updateRoutes(updatedRoutes)
    }
  }

  const handleAddVariableRow = (envId) => {
    const env = workspaceData.environments.find(e => e.id === envId)
    if (!env) return
    const vars = [...(env.variables || []), { key: '', value: '' }]
    handleUpdateEnvVariables(envId, vars)
  }

  const handleUpdateVariableRow = (envId, index, field, val) => {
    const env = workspaceData.environments.find(e => e.id === envId)
    if (!env) return
    const vars = [...(env.variables || [])]
    vars[index] = { ...vars[index], [field]: val }
    handleUpdateEnvVariables(envId, vars)
  }

  const handleDeleteVariableRow = (envId, index) => {
    const env = workspaceData.environments.find(e => e.id === envId)
    if (!env) return
    const vars = [...(env.variables || [])]
    vars.splice(index, 1)
    handleUpdateEnvVariables(envId, vars)
  }

  // Update request input options
  const handleUpdateReqField = (field, value) => {
    if (!activeReqConfig || !workspaceData) return
    
    let updatedConfig = { ...activeReqConfig, [field]: value }
    
    if (field === 'queryParams') {
      const newUrl = buildUrlWithParams(activeReqConfig.url || '', value)
      updatedConfig.url = newUrl
    } else if (field === 'url') {
      const newParams = parseQueryParamsFromUrl(value)
      updatedConfig.queryParams = newParams
    }

    setActiveReqConfig(updatedConfig)

    // Save tree structure
    const updatedCols = workspaceData.collections.map(c => {
      const updatedReqs = c.requests.map(r => {
        if (r.id === activeRequestId) {
          return updatedConfig
        }
        return r
      })
      return { ...c, requests: updatedReqs }
    })
    
    saveWorkspaceState({
      ...workspaceData,
      collections: updatedCols
    })
  }

  // Options row tables
  const handleAddRow = (type) => {
    const list = activeReqConfig[type] || []
    handleUpdateReqField(type, [...list, { key: '', value: '' }])
  }

  const handleUpdateRow = (type, index, field, val) => {
    const list = [...(activeReqConfig[type] || [])]
    list[index][field] = val
    handleUpdateReqField(type, list)
  }

  const handleDeleteRow = (type, index) => {
    const list = [...(activeReqConfig[type] || [])]
    list.splice(index, 1)
    handleUpdateReqField(type, list)
  }

  // Trigger CoAP Send
  const handleSendRequest = async () => {
    if (!activeReqConfig) return
    setResponse(null)
    setScriptLogs([])
    setErrorText('')
    setIsRequesting(true)

    // Resolve variables in request configuration before sending
    const resolvedConfig = interpolateRequestConfig(activeReqConfig)

    try {

      const res = await window.api.coap.send({ ...resolvedConfig, bindToMockPort })
      setIsRequesting(false)
      if (res.success) {
        setResponse(res.response)
        setScriptLogs(res.logs || [])
      } else {
        setErrorText(res.error || 'Request failed')
        setScriptLogs(res.logs || [])
      }
    } catch (e) {
      setIsRequesting(false)
      setErrorText(e.message)
    }
  }

  // Trigger Observe Stream
  const handleToggleObserve = () => {
    if (isObserving) {
      if (observeTeardown) observeTeardown()
      setIsObserving(false)
      setObserveTeardown(null)
      return
    }

    if (!activeReqConfig) return
    setResponse(null)
    setObserveLogs([])
    setScriptLogs([])
    setErrorText('')
    setIsObserving(true)
    setResponseTab('observe')

    // Resolve variables before starting observe stream
    const resolvedConfig = interpolateRequestConfig(activeReqConfig)

    try {
      const teardown = window.api.coap.observe({ ...resolvedConfig, bindToMockPort }, (update) => {
        if (update.type === 'message') {
          setObserveLogs(prev => [update.response, ...prev])
          if (update.logs && update.logs.length > 0) {
            setScriptLogs(prev => [...prev, ...update.logs])
          }
        } else if (update.type === 'log') {
          setScriptLogs(prev => [...prev, ...update.logs])
        } else if (update.type === 'error') {
          setErrorText(update.error)
          setIsObserving(false)
        }
      })

      setObserveTeardown(() => teardown)
    } catch (e) {
      setIsObserving(false)
      setErrorText(e.message)
    }
  }

  // Cancel running request
  const handleCancelRequest = async () => {
    if (!activeReqConfig) return
    await window.api.coap.cancel(activeRequestId)
    setIsRequesting(false)
    setErrorText('Request cancelled')
  }

  // Helper method style color
  const getMethodStyle = (method) => {
    switch (method) {
      case 'GET': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
      case 'POST': return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5'
      case 'PUT': return 'text-violet-400 border-violet-500/20 bg-violet-500/5'
      case 'DELETE': return 'text-rose-400 border-rose-500/20 bg-rose-500/5'
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5'
    }
  }

  const openInputModal = (type, targetId) => {
    setModalType(type)
    setModalTargetId(targetId)
    setIsModalOpen(true)
  }

  const selectedEnvironment = (workspaceData?.environments || []).find(e => e.id === activeEnvId)

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none relative">
      
      {/* FLOATING HOVER VARIABLES TOOLTIP */}
      {tooltip.show && (
        <div 
          style={{ left: tooltip.x, top: tooltip.y }}
          className={`fixed px-3 py-1.5 rounded-lg border text-[10px] font-mono shadow-2xl z-[999] pointer-events-none transform -translate-x-1/2 animate-scale-up ${
            tooltip.isError 
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-300' 
              : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-300'
          }`}
        >
          {tooltip.text}
        </div>
      )}

      {/* FLOATING VARIABLE AUTOCOMPLETE SUGGESTIONS */}
      {suggestion.show && suggestion.list.length > 0 && (
        <div 
          style={{ left: suggestion.x, top: suggestion.y }}
          className="fixed bg-slate-900 border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl z-[9999] w-64 p-1 flex flex-col gap-0.5 font-mono text-[11px]"
        >
          {suggestion.list.map((v, idx) => (
            <div 
              key={v.key}
              onClick={() => insertSelectedSuggestion(v)}
              className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition ${
                suggestion.activeIndex === idx
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <span className="font-semibold truncate">{v.key}</span>
              <span className={`text-[9px] truncate ml-2 max-w-[120px] ${suggestion.activeIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>
                {v.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {workspaceData ? (
        // ACTIVE WORKSPACE VIEW
        <>
          {/* LEFT SIDEBAR: explorer */}
          <aside style={{ width: sidebarWidth }} className="relative border-r border-white/5 bg-slate-950/80 flex flex-col justify-between flex-shrink-0">
            {/* Vertical Sidebar drag resizer divider */}
            <div 
              onMouseDown={startResizeSidebar}
              className="absolute top-0 right-0 w-[4px] cursor-col-resize h-full hover:bg-indigo-500/50 transition-colors z-20"
            />
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Workspace info & close button */}
              <div className="p-4 border-b border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Workspace Directory</label>
                  <button 
                    onClick={handleCloseWorkspace}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                    title="Close workspace folder"
                  >
                    Close
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-slate-200 outline-none w-full">
                  <span className="text-indigo-400 font-semibold">📁</span>
                  <span className="truncate" title={activeWorkspacePath}>{workspaceData.name}</span>
                </div>
              </div>

              {/* Sidebar Tabs: Collections vs Environments vs Mock Server */}
              <div className="flex border-b border-white/5 bg-slate-950/40 text-xs font-semibold">
                <button
                  onClick={() => setSidebarTab('collections')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    sidebarTab === 'collections'
                      ? 'border-indigo-500 text-slate-100 bg-white/[0.01]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Collections
                </button>
                <button
                  onClick={() => setSidebarTab('environments')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    sidebarTab === 'environments'
                      ? 'border-indigo-500 text-slate-100 bg-white/[0.01]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Environments
                </button>
                <button
                  onClick={() => setSidebarTab('mock')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    sidebarTab === 'mock'
                      ? 'border-indigo-500 text-slate-100 bg-white/[0.01]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mock Server
                </button>
              </div>

              {/* Sidebar Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4">
                
                {/* 1. COLLECTIONS VIEW */}
                {sidebarTab === 'collections' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Folders</span>
                      <button 
                        onClick={() => openInputModal('collection', '')}
                        className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded hover:bg-white/10 transition text-slate-300"
                      >
                        + Folder
                      </button>
                    </div>

                    {(workspaceData.collections || []).map(col => (
                      <div key={col.id} className="mb-4">
                        <div className="flex justify-between items-center py-1 group">
                          <div className="flex items-center gap-2 text-slate-300 font-medium text-sm overflow-hidden mr-2">
                            <span className="text-amber-500 text-base flex-shrink-0">📁</span>
                            <span className="truncate">{col.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button 
                              onClick={() => openInputModal('request', col.id)}
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-400 hover:text-indigo-300 transition"
                            >
                              + Req
                            </button>
                            <button 
                              onClick={() => handleDeleteCollection(col.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-xs transition px-1"
                              title="Delete collection folder and nested requests"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <ul className="pl-4 mt-1 border-l border-white/5 space-y-1">
                          {(col.requests || []).map(req => (
                            <li 
                              key={req.id}
                              className={`flex justify-between items-center p-2 rounded-lg text-xs group cursor-pointer border ${
                                activeRequestId === req.id 
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-100' 
                                  : 'border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                              onClick={() => setActiveRequestId(req.id)}
                            >
                              <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getMethodStyle(req.method)}`}>
                                  {req.method}
                                </span>
                                <span className="truncate">{req.name}</span>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteRequest(col.id, req.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-sm"
                              >
                                &times;
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {(!workspaceData.collections || workspaceData.collections.length === 0) && (
                      <div className="text-slate-500 italic text-xs text-center mt-8">
                        No folders added yet
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ENVIRONMENTS VIEW */}
                {sidebarTab === 'environments' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environments</span>
                      <button 
                        onClick={() => openInputModal('env', '')}
                        className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded hover:bg-white/10 transition text-slate-300"
                      >
                        + Env
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(workspaceData.environments || []).map(env => (
                        <div
                          key={env.id}
                          onClick={() => setActiveEnvId(env.id)}
                          className={`flex justify-between items-center p-2.5 rounded-lg border text-xs cursor-pointer group transition ${
                            activeEnvId === env.id
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-100'
                              : 'border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <span>🌱</span>
                            <span className="truncate">{env.name}</span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEnvironment(env.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-sm"
                          >
                            &times;
                          </button>
                        </div>
                      ))}

                      {(!workspaceData.environments || workspaceData.environments.length === 0) && (
                        <div className="text-slate-500 italic text-xs text-center mt-8">
                          No environments created yet
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. MOCK SERVER VIEW */}
                {sidebarTab === 'mock' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mock Routes</span>
                      <button 
                        onClick={() => openInputModal('mockRoute', '')}
                        className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded hover:bg-white/10 transition text-slate-300"
                      >
                        + Route
                      </button>
                    </div>

                    <div className="space-y-1">
                      {(workspaceData.mockRoutes || []).map(route => (
                        <div 
                          key={route.id}
                          className={`flex justify-between items-center p-2 rounded-lg text-xs group cursor-pointer border ${
                            activeRouteId === route.id 
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-100' 
                              : 'border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
                          }`}
                          onClick={() => setActiveRouteId(route.id)}
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getMethodStyle(route.method || 'GET')}`}>
                              {route.method || 'GET'}
                            </span>
                            <span className="truncate font-mono">{route.path}</span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMockRoute(route.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-sm font-bold"
                          >
                            &times;
                          </button>
                        </div>
                      ))}

                      {(!workspaceData.mockRoutes || workspaceData.mockRoutes.length === 0) && (
                        <div className="text-slate-500 italic text-xs text-center mt-8">
                          No mock routes created yet
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="p-4 border-t border-white/5 text-xs text-slate-500 text-center">
              CoapNode v1.0.0 &bull; Local Client
            </div>
          </aside>

          {/* CENTRAL / RIGHT PANELS */}
          <main className="flex-1 flex flex-col bg-slate-900/50 overflow-hidden">
            
            {/* Conditional Central Panel: Config Editor vs Environment Editor */}
            {sidebarTab === 'environments' && selectedEnvironment ? (
              // 1. ENVIRONMENTS EDITOR PANEL
              <div className="flex-grow flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌱</span>
                    <h2 className="text-xl font-bold text-slate-100">{selectedEnvironment.name} Variables</h2>
                  </div>
                  <button
                    onClick={() => handleAddVariableRow(selectedEnvironment.id)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold px-4 py-2 rounded-xl text-white shadow-lg transition"
                  >
                    + Add Variable
                  </button>
                </div>

                <div className="space-y-3 max-w-3xl">
                  {selectedEnvironment.variables?.map((v, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={v.key}
                        onChange={(e) => handleUpdateVariableRow(selectedEnvironment.id, index, 'key', e.target.value)}
                        placeholder="Variable Key (e.g. host)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                      />
                      <input
                        type="text"
                        value={v.value}
                        onChange={(e) => handleUpdateVariableRow(selectedEnvironment.id, index, 'value', e.target.value)}
                        placeholder="Value (e.g. 127.0.0.1)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                      />
                      <button
                        onClick={() => handleDeleteVariableRow(selectedEnvironment.id, index)}
                        className="text-rose-500 hover:text-rose-400 text-lg px-2"
                      >
                        &times;
                      </button>
                    </div>
                  ))}

                  {(!selectedEnvironment.variables || selectedEnvironment.variables.length === 0) && (
                    <div className="text-slate-500 italic text-sm text-center p-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                      No variables defined. Define variables and use them in requests as <code className="text-indigo-400 font-mono">{"{{variable}}"}</code>.
                    </div>
                  )}
                </div>
              </div>

            ) : sidebarTab === 'mock' ? (
              // MOCK SERVER PANEL
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/10">
                {/* Mock Server Header Controller */}
                <div className="p-4 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-xl">🛠️</span>
                    <h2 className="text-base font-bold text-slate-100">CoAP Mock Server</h2>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
                      <span className={`w-2 h-2 rounded-full ${isMockRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      <span className="font-semibold text-slate-300">
                        {isMockRunning ? `Running on Port ${workspaceData.mockPort || 5683}` : 'Stopped'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Port configuration */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Port</span>
                      <input
                        type="number"
                        value={workspaceData.mockPort || 5683}
                        disabled={isMockRunning}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 5683
                          saveWorkspaceState({
                            ...workspaceData,
                            mockPort: val
                          })
                        }}
                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono disabled:opacity-50"
                      />
                    </div>

                    {/* Start/Stop Button */}
                    <button
                      onClick={handleToggleMockServer}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-lg ${
                        isMockRunning 
                          ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isMockRunning ? 'Stop Server' : 'Start Server'}
                    </button>
                  </div>
                </div>

                {/* Main panel: Stacked Route Editor (Top) & Activity/Console logs (Bottom) */}
                <div id="main-panel-container" className="flex-1 flex flex-col overflow-hidden relative">
                  {/* Top: Route Editor */}
                  <div style={{ height: requestHeight }} className="flex flex-col overflow-hidden flex-shrink-0 relative border-b border-white/5 bg-slate-900/10">
                    {activeRoute ? (
                      <div className="flex-grow flex flex-col overflow-hidden min-h-0">
                        {/* Route method, path bar */}
                        <div className="p-4 border-b border-white/5 bg-slate-950/10 flex gap-3 items-center flex-shrink-0">
                          <select
                            value={activeRoute.method || 'GET'}
                            onChange={(e) => handleUpdateMockRoute(activeRoute.id, { method: e.target.value })}
                            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500/40"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>

                          <input
                            type="text"
                            value={activeRoute.path || ''}
                            onChange={(e) => handleUpdateMockRoute(activeRoute.id, { path: e.target.value })}
                            placeholder="/resource-path"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                          />
                        </div>

                        {/* Script Editor & Sandbox Reference */}
                        <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
                          {/* Script Editor Area */}
                          <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Sandbox Handler Script (NodeJS)</label>
                            
                            <div className="flex-grow flex bg-slate-950 border border-white/10 rounded-xl overflow-hidden font-mono text-xs relative h-full">
                              {/* Gutter scroll synced */}
                              <div 
                                ref={mockRouteScriptGutterRef}
                                className="w-10 bg-slate-900/60 border-r border-white/5 py-3 pr-2 text-right text-slate-600 select-none overflow-y-hidden text-[11px]"
                                style={{ lineHeight: '20px' }}
                              >
                                {Array.from({ length: (activeRoute.script || '').split('\n').length || 1 }).map((_, idx) => (
                                  <div key={idx} className="h-5">{idx + 1}</div>
                                ))}
                              </div>
                              <textarea
                                ref={mockRouteScriptTextareaRef}
                                value={activeRoute.script || ''}
                                onChange={(e) => {
                                  handleUpdateMockRoute(activeRoute.id, { script: e.target.value })
                                  checkAutocompleteTrigger(e, e.target.value)
                                }}
                                onKeyDown={handleInputKeyDown}
                                onScroll={(e) => {
                                  if (mockRouteScriptGutterRef.current) {
                                    mockRouteScriptGutterRef.current.scrollTop = e.target.scrollTop
                                  }
                                }}
                                placeholder="// Write custom mock response script here...&#10;response.code = '2.05';&#10;response.payload = JSON.stringify({ hello: 'world' });"
                                className="flex-grow py-3 px-3 bg-transparent outline-none text-indigo-200 resize-none h-full overflow-y-auto leading-5"
                                style={{ lineHeight: '20px', fontFamily: 'monospace' }}
                              />
                            </div>
                          </div>

                          {/* Reference Side Pane */}
                          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-slate-950/20 p-4 overflow-y-auto text-xs text-slate-400">
                            <h3 className="font-semibold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">VM Sandbox Context</h3>
                            <div className="space-y-3 font-mono text-[10px]">
                              <div>
                                <span className="text-indigo-300 block">request</span>
                                <span className="text-slate-500 pl-2 block">- method: string</span>
                                <span className="text-slate-500 pl-2 block">- payload: string</span>
                                <span className="text-slate-500 pl-2 block">- options: Array{"<{key, value}>"}</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block">response</span>
                                <span className="text-slate-500 pl-2 block">- code: string (default '2.05')</span>
                                <span className="text-slate-500 pl-2 block">- payload: string (default 'Mock Response')</span>
                                <span className="text-slate-500 pl-2 block">- options: Array{"<{key, value}>"}</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block">console.log(...args)</span>
                                <span className="text-slate-500 pl-2 block">Logs to mock script log console</span>
                              </div>
                              
                              <div className="h-px bg-white/5 pt-2" />
                              <span className="font-semibold text-slate-200">Example:</span>
                              <code className="text-indigo-400 block whitespace-pre-wrap leading-relaxed">
{`// Return JSON response
response.code = '2.05';
response.payload = JSON.stringify({
  status: 'ok',
  received: request.payload
});
response.options.push({
  key: 'Content-Format',
  value: '50'
});
console.log('Processed request: ' + request.payload);`}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-grow flex items-center justify-center text-slate-500 italic text-sm">
                        Select a mock route from the sidebar, or create a new route to edit its behavior.
                      </div>
                    )}
                  </div>

                  {/* Horizontal Resizer Divider handle */}
                  <div 
                    onMouseDown={startResizeRequest}
                    className="h-[4px] cursor-row-resize bg-white/5 hover:bg-indigo-500/50 transition-colors z-20 flex-shrink-0"
                  />

                  {/* Bottom: Logs & Console */}
                  <div className="flex-grow flex flex-col overflow-hidden bg-slate-950/5 min-h-[150px]">
                    <div className="flex justify-between items-center border-b border-white/5 bg-slate-950/10 flex-shrink-0 pr-4">
                      <div className="flex">
                        {['activity', 'console'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setMockLogsTab(tab)}
                            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                              mockLogsTab === tab 
                                ? 'border-indigo-500 text-slate-100 bg-white/[0.02]' 
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {tab === 'activity' ? 'Request Activity' : 'Script Console Logs'}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          if (mockLogsTab === 'activity') {
                            setMockActivityLogs([])
                          } else {
                            setMockConsoleLogs([])
                          }
                        }}
                        className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded hover:bg-white/10 transition text-slate-300 font-semibold"
                      >
                        Clear Logs
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 font-mono text-xs min-h-0">
                      {mockLogsTab === 'activity' ? (
                        <div className="space-y-1">
                          {mockActivityLogs.map((log, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 border-b border-white/5 text-slate-300 text-[11px]">
                              <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${getMethodStyle(log.method)}`}>
                                {log.method}
                              </span>
                              <span className="text-slate-200 font-semibold truncate max-w-[200px]" title={log.path}>{log.path}</span>
                              <span className="text-slate-500 text-[10px] sm:ml-auto">{log.remoteAddress}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold self-start sm:self-auto ${
                                log.matched ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {log.matched ? 'MATCHED' : '404 NOT FOUND'}
                              </span>
                            </div>
                          ))}
                          {mockActivityLogs.length === 0 && (
                            <div className="text-slate-500 italic text-center py-6 text-xs">
                              No activity logs yet. Send a CoAP request to port {workspaceData.mockPort || 5683}.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {mockConsoleLogs.map((item, idx) => (
                            <div key={idx} className="border-b border-white/5 pb-2">
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                                <span>[{item.timestamp}]</span>
                                <span className="text-indigo-400 font-semibold">{item.path}</span>
                              </div>
                              <div className="space-y-0.5 pl-2">
                                {item.logs.map((logLine, lIdx) => (
                                  <div key={lIdx} className={logLine.startsWith('[Script Error]') ? 'text-rose-400 font-bold' : 'text-indigo-200'}>
                                    {logLine}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {mockConsoleLogs.length === 0 && (
                            <div className="text-slate-500 italic text-center py-6 text-xs">
                              No sandbox script console logs yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeReqConfig ? (
              // 2. CENTRAL REQUEST CONFIG EDITOR
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Topbar URL / Methods */}
                <div className="p-4 border-b border-white/5 bg-slate-950/20 flex gap-3 items-center">
                  
                  {/* Method select */}
                  <select
                    value={activeReqConfig.method}
                    onChange={(e) => handleUpdateReqField('method', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-semibold focus:border-indigo-500 outline-none"
                  >
                    <option value="GET" className="bg-slate-900 text-emerald-400">GET</option>
                    <option value="POST" className="bg-slate-900 text-indigo-400">POST</option>
                    <option value="PUT" className="bg-slate-900 text-violet-400">PUT</option>
                    <option value="DELETE" className="bg-slate-900 text-rose-400">DELETE</option>
                  </select>

                  {/* URL Input (with hover tooltip preview) */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={activeReqConfig.url}
                      data-field-type="url"
                      onChange={(e) => {
                        handleUpdateReqField('url', e.target.value)
                        handleInputHover(e, e.target.value)
                        checkAutocompleteTrigger(e, e.target.value)
                      }}
                      onKeyDown={handleInputKeyDown}
                      onMouseEnter={(e) => handleInputHover(e, activeReqConfig.url)}
                      onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })}
                      placeholder="coap://{{host}}:5683/resource"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Active Environment Selector Dropdown */}
                  <select
                    value={workspaceData.activeEnvironmentId || ''}
                    onChange={(e) => handleSetActiveEnvironment(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-indigo-400 font-medium outline-none max-w-[150px] truncate"
                    title="Active Environment"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">No Environment</option>
                    {(workspaceData.environments || []).map(env => (
                      <option key={env.id} value={env.id} className="bg-slate-900 text-slate-200">
                        🌱 {env.name}
                      </option>
                    ))}
                  </select>

                  {/* Bind to Mock Port Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="checkbox"
                      id="bind-mock"
                      checked={bindToMockPort}
                      onChange={(e) => setBindToMockPort(e.target.checked)}
                      disabled={!isMockRunning}
                      className="accent-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor="bind-mock"
                      className={`text-xs font-medium whitespace-nowrap cursor-pointer select-none transition ${
                        isMockRunning
                          ? bindToMockPort
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                          : 'text-slate-600'
                      }`}
                    >
                      Bind mock{isMockRunning ? ` (${workspaceData?.mockPort || 5683})` : ''}
                    </label>
                  </div>

                  {/* Action Buttons */}
                  {isRequesting ? (
                    <button
                      onClick={handleCancelRequest}
                      className="bg-rose-600 hover:bg-rose-500 transition px-6 py-2 rounded-lg text-sm font-semibold shadow-lg text-white"
                    >
                      Cancel
                    </button>
                  ) : activeReqConfig.method === 'GET' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendRequest}
                        disabled={isObserving}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition px-6 py-2 rounded-lg text-sm font-semibold shadow-lg text-white"
                      >
                        Send
                      </button>
                      <button
                        onClick={handleToggleObserve}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold shadow-lg border transition ${
                          isObserving 
                            ? 'bg-rose-600 border-rose-500 text-white animate-pulse' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        {isObserving ? 'Stop Observe' : 'Observe'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendRequest}
                      className="bg-indigo-600 hover:bg-indigo-500 transition px-6 py-2 rounded-lg text-sm font-semibold shadow-lg text-white"
                    >
                      Send
                    </button>
                  )}
                </div>

                {/* Main content panel: Stacked Request Config (Top) & Response (Bottom) */}
                <div id="main-panel-container" className="flex-1 flex flex-col overflow-hidden relative">
                  
                  {/* Top Request Config Panel */}
                  <div style={{ height: requestHeight }} className="flex flex-col overflow-hidden flex-shrink-0 relative border-b border-white/5 bg-slate-900/10">
                    <div className="flex border-b border-white/5 bg-slate-950/10 flex-shrink-0">
                      {['params', 'options', 'body', 'preScript', 'postScript'].map((tab) => {
                        if (tab === 'body' && ['GET', 'DELETE'].includes(activeReqConfig.method)) return null
                        
                        return (
                          <button
                            key={tab}
                            onClick={() => setRequestTab(tab)}
                            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                              requestTab === tab 
                                ? 'border-indigo-500 text-slate-100 bg-white/[0.02]' 
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {tab === 'preScript' ? 'Pre-Script' : tab === 'postScript' ? 'Post-Script' : tab.toUpperCase()}
                          </button>
                        )
                      })}
                    </div>

                    {/* Tab Content Panel */}
                    <div className="flex-grow p-4 overflow-y-auto min-h-0">
                      
                      {/* Params Table */}
                      {requestTab === 'params' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">URI Query Parameters</label>
                            <button
                              onClick={() => handleAddRow('queryParams')}
                              className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded transition"
                            >
                              + Add Param
                            </button>
                          </div>

                          <div className="space-y-2">
                            {activeReqConfig.queryParams?.map((row, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={row.key}
                                  data-field-type="queryParams"
                                  data-row-index={idx}
                                  data-field-key="key"
                                  onChange={(e) => {
                                    handleUpdateRow('queryParams', idx, 'key', e.target.value)
                                    handleInputHover(e, e.target.value)
                                    checkAutocompleteTrigger(e, e.target.value)
                                  }}
                                  onKeyDown={handleInputKeyDown}
                                  onMouseEnter={(e) => handleInputHover(e, row.key)}
                                  onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })}
                                  placeholder="Key"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                                />
                                <input
                                  type="text"
                                  value={row.value}
                                  data-field-type="queryParams"
                                  data-row-index={idx}
                                  data-field-key="value"
                                  onChange={(e) => {
                                    handleUpdateRow('queryParams', idx, 'value', e.target.value)
                                    handleInputHover(e, e.target.value)
                                    checkAutocompleteTrigger(e, e.target.value)
                                  }}
                                  onKeyDown={handleInputKeyDown}
                                  onMouseEnter={(e) => handleInputHover(e, row.value)}
                                  onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })}
                                  placeholder="Value"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                                />
                                <button
                                  onClick={() => handleDeleteRow('queryParams', idx)}
                                  className="text-rose-500 hover:text-rose-400 text-lg px-1"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                            {(!activeReqConfig.queryParams || activeReqConfig.queryParams.length === 0) && (
                              <div className="text-xs text-slate-500 italic p-2 bg-white/5 rounded border border-white/5 text-center">
                                No query parameters added
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Options Table */}
                      {requestTab === 'options' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custom CoAP Options</label>
                            <button
                              onClick={() => handleAddRow('headers')}
                              className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded transition"
                            >
                              + Add Option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {activeReqConfig.headers?.map((row, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={row.key}
                                  data-field-type="headers"
                                  data-row-index={idx}
                                  data-field-key="key"
                                  onChange={(e) => {
                                    handleUpdateRow('headers', idx, 'key', e.target.value)
                                    handleInputHover(e, e.target.value)
                                    checkAutocompleteTrigger(e, e.target.value)
                                  }}
                                  onKeyDown={handleInputKeyDown}
                                  onMouseEnter={(e) => handleInputHover(e, row.key)}
                                  onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })}
                                  placeholder="e.g. Content-Format"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                                />
                                <input
                                  type="text"
                                  value={row.value}
                                  data-field-type="headers"
                                  data-row-index={idx}
                                  data-field-key="value"
                                  onChange={(e) => {
                                    handleUpdateRow('headers', idx, 'value', e.target.value)
                                    handleInputHover(e, e.target.value)
                                    checkAutocompleteTrigger(e, e.target.value)
                                  }}
                                  onKeyDown={handleInputKeyDown}
                                  onMouseEnter={(e) => handleInputHover(e, row.value)}
                                  onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })}
                                  placeholder="e.g. application/json"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 font-mono"
                                />
                                <button
                                  onClick={() => handleDeleteRow('headers', idx)}
                                  className="text-rose-500 hover:text-rose-400 text-lg px-1"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                            {(!activeReqConfig.headers || activeReqConfig.headers.length === 0) && (
                              <div className="text-xs text-slate-500 italic p-2 bg-white/5 rounded border border-white/5 text-center">
                                No options added
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Body */}
                      {requestTab === 'body' && (
                        <div className="h-full flex flex-col gap-2">
                          <div className="flex justify-between items-center flex-shrink-0">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Payload</label>
                            <div className="flex gap-2 bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
                              <button
                                onClick={() => handleUpdateReqField('payloadType', 'text')}
                                className={`px-2.5 py-1 rounded-md transition font-semibold ${
                                  (activeReqConfig.payloadType || 'text') === 'text'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Text
                              </button>
                              <button
                                onClick={() => handleUpdateReqField('payloadType', 'json')}
                                className={`px-2.5 py-1 rounded-md transition font-semibold ${
                                  activeReqConfig.payloadType === 'json'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                JSON
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex flex-col relative min-h-0">
                            <textarea
                              value={activeReqConfig.payload || ''}
                              data-field-type="payload"
                              onChange={(e) => {
                                handleUpdateReqField('payload', e.target.value)
                                handleInputHover(e, e.target.value)
                                checkAutocompleteTrigger(e, e.target.value)
                              }}
                              onKeyDown={handleInputKeyDown}
                              onMouseEnter={(e) => handleInputHover(e, activeReqConfig.payload)}
                              onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0, isError: false })}
                              placeholder={activeReqConfig.payloadType === 'json' ? '{\n  "key": "value"\n}' : 'Raw text payload to send (POST/PUT)...'}
                              className={`flex-grow w-full bg-slate-950 border rounded-lg p-3 text-xs text-slate-200 outline-none font-mono resize-none h-full overflow-y-auto ${
                                activeReqConfig.payloadType === 'json' && activeReqConfig.payload && !isValidJson(activeReqConfig.payload)
                                  ? 'border-rose-500/50 focus:border-rose-500'
                                  : 'border-white/10 focus:border-indigo-500/50'
                              }`}
                            />
                            
                            {activeReqConfig.payloadType === 'json' && activeReqConfig.payload && !isValidJson(activeReqConfig.payload) && (
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-rose-950 border border-rose-500/30 text-rose-400 text-[9px] rounded font-mono">
                                Invalid JSON format
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pre-Request Script */}
                      {requestTab === 'preScript' && (
                        <div className="h-full flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pre-Request Script (NodeJS sandbox)</label>
                            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">JavaScript Enabled</span>
                          </div>
                          
                          <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden min-h-0">
                            <div className="flex-1 flex bg-slate-950 border border-white/10 rounded-lg overflow-hidden font-mono text-xs relative h-full">
                              {/* Gutter scroll synced */}
                              <div 
                                ref={preScriptGutterRef}
                                className="w-10 bg-slate-900/60 border-r border-white/5 py-3 pr-2 text-right text-slate-600 select-none overflow-y-hidden text-[11px]"
                                style={{ lineHeight: '20px' }}
                              >
                                {Array.from({ length: (activeReqConfig.preScript || '').split('\n').length || 1 }).map((_, idx) => (
                                  <div key={idx} className="h-5">{idx + 1}</div>
                                ))}
                              </div>
                              <textarea
                                ref={preScriptTextareaRef}
                                value={activeReqConfig.preScript || ''}
                                onChange={(e) => {
                                  handleUpdateReqField('preScript', e.target.value)
                                  checkAutocompleteTrigger(e, e.target.value)
                                }}
                                onKeyDown={handleInputKeyDown}
                                onScroll={(e) => {
                                  if (preScriptGutterRef.current) {
                                    preScriptGutterRef.current.scrollTop = e.target.scrollTop
                                  }
                                }}
                                placeholder="// Write pre-request script here...&#10;request.payload = 'mutated payload';"
                                className="flex-grow py-3 px-3 bg-transparent outline-none text-indigo-200 resize-none h-full overflow-y-auto leading-5"
                                style={{ lineHeight: '20px', fontFamily: 'monospace' }}
                              />
                            </div>
                            
                            {/* Script Reference Tips Panel */}
                            <div className="w-full md:w-56 p-3 bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-slate-400 flex flex-col gap-2 font-sans select-text overflow-y-auto h-full flex-shrink-0">
                              <span className="font-semibold text-slate-200 text-xs">NodeJS Sandbox API</span>
                              <p>This script runs in a sandboxed NodeJS `vm` context before request transmission.</p>
                              <div className="h-px bg-white/5" />
                              <span className="font-semibold text-slate-200">Context Properties:</span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-300 font-mono">
                                <li>request.url (string)</li>
                                <li>request.payload (string)</li>
                                <li>request.method (string)</li>
                              </ul>
                              <div className="h-px bg-white/5" />
                              <span className="font-semibold text-slate-200">Examples:</span>
                              <code className="text-indigo-400 block whitespace-pre-wrap">request.payload = "Mutated text";&#10;console.log("Starting req...");</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Post-Request Script */}
                      {requestTab === 'postScript' && (
                        <div className="h-full flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Post-Request Script (NodeJS sandbox)</label>
                            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">JavaScript Enabled</span>
                          </div>
                          
                          <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden min-h-0">
                            <div className="flex-1 flex bg-slate-950 border border-white/10 rounded-lg overflow-hidden font-mono text-xs relative h-full">
                              {/* Gutter scroll synced */}
                              <div 
                                ref={postScriptGutterRef}
                                className="w-10 bg-slate-900/60 border-r border-white/5 py-3 pr-2 text-right text-slate-600 select-none overflow-y-hidden text-[11px]"
                                style={{ lineHeight: '20px' }}
                              >
                                {Array.from({ length: (activeReqConfig.postScript || '').split('\n').length || 1 }).map((_, idx) => (
                                  <div key={idx} className="h-5">{idx + 1}</div>
                                ))}
                              </div>
                              <textarea
                                ref={postScriptTextareaRef}
                                value={activeReqConfig.postScript || ''}
                                onChange={(e) => {
                                  handleUpdateReqField('postScript', e.target.value)
                                  checkAutocompleteTrigger(e, e.target.value)
                                }}
                                onKeyDown={handleInputKeyDown}
                                onScroll={(e) => {
                                  if (postScriptGutterRef.current) {
                                    postScriptGutterRef.current.scrollTop = e.target.scrollTop
                                  }
                                }}
                                placeholder="// Write post-request script here...&#10;console.log('Status: ' + response.code);"
                                className="flex-grow py-3 px-3 bg-transparent outline-none text-indigo-200 resize-none h-full overflow-y-auto leading-5"
                                style={{ lineHeight: '20px', fontFamily: 'monospace' }}
                              />
                            </div>
                            
                            {/* Script Reference Tips Panel */}
                            <div className="w-full md:w-56 p-3 bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-slate-400 flex flex-col gap-2 font-sans select-text overflow-y-auto h-full flex-shrink-0">
                              <span className="font-semibold text-slate-200 text-xs">NodeJS Sandbox API</span>
                              <p>This script runs in a sandboxed NodeJS `vm` context after response reception.</p>
                              <div className="h-px bg-white/5" />
                              <span className="font-semibold text-slate-200">Context Properties:</span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-300 font-mono">
                                <li>response.code (string)</li>
                                <li>response.payload (string)</li>
                                <li>response.options (array)</li>
                              </ul>
                              <div className="h-px bg-white/5" />
                              <span className="font-semibold text-slate-200">Examples:</span>
                              <code className="text-indigo-400 block whitespace-pre-wrap">console.log("Body: " + response.payload);</code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Resizer Divider handle */}
                  <div 
                    onMouseDown={startResizeRequest}
                    className="h-[4px] cursor-row-resize bg-white/5 hover:bg-indigo-500/50 transition-colors z-20 flex-shrink-0"
                  />

                  {/* Bottom Response Panel */}
                  <div className="flex-grow flex flex-col overflow-hidden bg-slate-950/5 min-h-[150px]">
                    <div className="flex border-b border-white/5 bg-slate-950/10 flex-shrink-0">
                      <button
                        onClick={() => setResponseTab('body')}
                        className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                          responseTab === 'body' 
                            ? 'border-indigo-500 text-slate-100 bg-white/[0.02]' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        BODY
                      </button>
                      <button
                        onClick={() => setResponseTab('options')}
                        className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                          responseTab === 'options' 
                            ? 'border-indigo-500 text-slate-100 bg-white/[0.02]' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        OPTIONS
                      </button>
                      {isObserving && (
                        <button
                          onClick={() => setResponseTab('observe')}
                          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                            responseTab === 'observe' 
                              ? 'border-indigo-500 text-slate-100 bg-white/[0.02]' 
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          OBSERVE LOGS
                        </button>
                      )}
                      <button
                        onClick={() => setResponseTab('logs')}
                        className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                          responseTab === 'logs' 
                            ? 'border-indigo-500 text-slate-100 bg-white/[0.02]' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        CONSOLE LOGS ({scriptLogs.length})
                      </button>
                    </div>

                    {/* Response content */}
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0 bg-slate-900/10">
                      {errorText && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-mono select-text flex-shrink-0">
                          {errorText}
                        </div>
                      )}

                      {/* Standard Output */}
                      {responseTab === 'body' && (
                        <div className="flex-grow flex flex-col min-h-0">
                          {response ? (
                            <div className="flex-grow flex flex-col min-h-0">
                              <div className="flex gap-4 items-center mb-3 bg-white/5 border border-white/5 p-3 rounded-lg text-xs select-text flex-shrink-0">
                                <div>Status: <span className="font-mono text-emerald-400 font-bold">{response.code}</span></div>
                                <div className="w-px h-3 bg-white/10" />
                                <div>Duration: <span className="font-mono text-indigo-400 font-bold">{response.duration} ms</span></div>
                              </div>

                              <textarea
                                readOnly
                                value={response.payload}
                                placeholder="Empty response body"
                                className="flex-grow w-full min-h-[100px] bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-slate-300 outline-none font-mono resize-none select-text h-full overflow-y-auto"
                              />
                            </div>
                          ) : (
                            <div className="text-slate-500 italic text-sm text-center mt-8">
                              Send a request to see the response payload
                            </div>
                          )}
                        </div>
                      )}

                      {/* Options Output */}
                      {responseTab === 'options' && (
                        <div className="flex-grow overflow-y-auto">
                          {response && response.options && response.options.length > 0 ? (
                            <div className="border border-white/10 rounded-lg overflow-hidden select-text">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-white/5 text-slate-400 font-semibold border-b border-white/10">
                                    <th className="p-2.5">Option Number / Name</th>
                                    <th className="p-2.5">Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {response.options.map((opt, i) => (
                                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                                      <td className="p-2.5 font-mono text-indigo-400">{opt.key}</td>
                                      <td className="p-2.5 font-mono text-slate-200 break-all">{opt.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-slate-500 italic text-sm text-center mt-8">
                              No option headers returned
                            </div>
                          )}
                        </div>
                      )}

                      {/* Observe Stream log */}
                      {responseTab === 'observe' && (
                        <div className="flex-grow flex flex-col select-text min-h-0">
                          <div className="flex justify-between items-center mb-3 flex-shrink-0">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stream Notifications</label>
                            <span className="text-[10px] text-rose-400 animate-pulse font-medium">● ACTIVE STREAM</span>
                          </div>

                          <div className="flex-grow bg-slate-950 border border-white/10 rounded-lg p-3 overflow-y-auto space-y-3 font-mono text-xs h-full min-h-[100px]">
                            {observeLogs.map((log, i) => (
                              <div key={i} className="border-b border-white/5 pb-2 last:border-0">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                  <span>Timestamp: {log.timestamp}</span>
                                  <span className="text-emerald-400">Code: {log.code}</span>
                                </div>
                                <div className="text-slate-300 bg-white/[0.02] p-2 rounded border border-white/5 whitespace-pre-wrap">
                                  {log.payload}
                                </div>
                              </div>
                            ))}
                            {observeLogs.length === 0 && (
                              <div className="text-slate-500 italic text-center pt-8">
                                Waiting for stream updates...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Console logs */}
                      {responseTab === 'logs' && (
                        <div className="flex-grow flex flex-col select-text min-h-0">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex-shrink-0">Sandbox Output Console</label>
                          <div className="flex-grow bg-slate-950 border border-white/10 rounded-lg p-3 font-mono text-xs text-indigo-300 overflow-y-auto space-y-1 h-full min-h-[100px]">
                            {scriptLogs.map((log, i) => (
                              <div key={i} className="border-b border-white/5 pb-1 last:border-0">
                                {log}
                              </div>
                            ))}
                            {scriptLogs.length === 0 && (
                              <div className="text-slate-500 italic text-center pt-8">
                                No logs printed. Use console.log() in scripts to print outputs.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // 3. NO ACTIVE REQUEST SELECTED VIEW
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-indigo-500/5">
                  C
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">No Active Request</h2>
                <p className="text-slate-400 text-sm max-w-sm">
                  {sidebarTab === 'environments' 
                    ? 'Select an environment in the sidebar to configure variables, or choose Collections tab to run requests.' 
                    : 'Choose a request from the collections tree on the sidebar, or create a folder collection to get started.'}
                </p>
              </div>
            )}
          </main>
        </>
      ) : (
        // LANDING / SETUP SCREEN
        <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col items-center justify-center p-6 relative">
          {/* Decorative Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

          <div className="max-w-md w-full bg-slate-900/60 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl flex flex-col gap-6 text-center animate-scale-up">
            
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
                C
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-wide mt-2">CoapNode Workspace Manager</h2>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Select a local directory to manage your collections. The configuration will be stored as <code className="text-indigo-300">coap-workspace.json</code> inside the directory.
              </p>
            </div>

            {/* Error Message */}
            {errorText && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono text-left select-text">
                {errorText}
              </div>
            )}

            {/* Main Action */}
            <button
              onClick={handleSelectDirectory}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition rounded-xl font-semibold text-sm text-white tracking-wide shadow-lg shadow-indigo-500/15 animate-fade-in"
            >
              Open / Create Workspace Folder
            </button>

            {/* Recent Workspaces */}
            {globalConfig.recentPaths && globalConfig.recentPaths.length > 0 && (
              <div className="flex flex-col gap-2.5 text-left border-t border-white/5 pt-4 select-text">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Recent Locations</span>
                  <button 
                    onClick={handleClearRecents}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Clear Recents
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {globalConfig.recentPaths.map((path, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenWorkspace(path)}
                      className="p-2.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer flex items-center gap-2 text-xs text-slate-300"
                    >
                      <span className="text-slate-400">📁</span>
                      <span className="truncate flex-1 font-mono text-[10px]">{path}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM INPUT MODALS */}
      <InputModal
        isOpen={isModalOpen && modalType === 'collection'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCollection}
        title="Create Folder Collection"
        placeholder="Enter folder name..."
      />

      <InputModal
        isOpen={isModalOpen && modalType === 'request'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRequest}
        title="Create CoAP Request"
        placeholder="Enter request name..."
      />

      <InputModal
        isOpen={isModalOpen && modalType === 'env'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEnvironment}
        title="Create Environment"
        placeholder="e.g. Production, Staging"
      />

      <InputModal
        isOpen={isModalOpen && modalType === 'mockRoute'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddMockRoute}
        title="Create Mock Route"
        placeholder="e.g. /hello"
      />

    </div>
  )
}
