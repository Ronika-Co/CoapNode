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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
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
  // Global path config
  const [globalConfig, setGlobalConfig] = useState({ lastWorkspacePath: '', recentPaths: [] })
  const [activeWorkspacePath, setActiveWorkspacePath] = useState('')
  const [workspaceData, setWorkspaceData] = useState(null)
  
  // Active request configs
  const [activeRequestId, setActiveRequestId] = useState('')
  const [activeReqConfig, setActiveReqConfig] = useState(null)
  
  // UI Tabs & States
  const [requestTab, setRequestTab] = useState('params') // 'params' | 'options' | 'body' | 'preScript' | 'postScript'
  const [responseTab, setResponseTab] = useState('body') // 'body' | 'options' | 'observe' | 'logs'
  const [isRequesting, setIsRequesting] = useState(false)
  const [isObserving, setIsObserving] = useState(false)
  const [observeTeardown, setObserveTeardown] = useState(null)

  // Custom Modal States
  const [modalType, setModalType] = useState('') // 'collection' | 'request' | 'rename' | ''
  const [modalTargetId, setModalTargetId] = useState('') // collection ID or workspace ID
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Response & Logs States
  const [response, setResponse] = useState(null)
  const [scriptLogs, setScriptLogs] = useState([])
  const [observeLogs, setObserveLogs] = useState([])
  const [errorText, setErrorText] = useState('')

  // Load configuration on mount
  useEffect(() => {
    window.api.storage.loadConfig().then((config) => {
      setGlobalConfig(config)
      if (config.lastWorkspacePath) {
        handleOpenWorkspace(config.lastWorkspacePath, config)
      }
    })
  }, [])

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

  // Open directory workspace
  const handleOpenWorkspace = async (dirPath, currentConfig = globalConfig) => {
    if (!dirPath) return
    try {
      const wsData = await window.api.storage.loadWorkspace(dirPath)
      setWorkspaceData(wsData)
      setActiveWorkspacePath(dirPath)
      
      // Update global config
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

  // Save changes to local directory
  const saveWorkspaceState = async (updatedData) => {
    setWorkspaceData(updatedData)
    if (activeWorkspacePath) {
      await window.api.storage.saveWorkspace(activeWorkspacePath, updatedData)
    }
  }

  // Close workspace and return to landing screen
  const handleCloseWorkspace = async () => {
    if (observeTeardown) observeTeardown()
    setIsObserving(false)
    setObserveTeardown(null)
    setWorkspaceData(null)
    setActiveWorkspacePath('')
    setActiveRequestId('')
    setResponse(null)

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
      collections: [...workspaceData.collections, newCol]
    }
    saveWorkspaceState(updated)
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
      preScript: '',
      postScript: ''
    }
    const updatedCols = workspaceData.collections.map(c => {
      if (c.id === modalTargetId) {
        return { ...c, requests: [...c.requests, newReq] }
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

  // Update current request field
  const handleUpdateReqField = (field, value) => {
    if (!activeReqConfig || !workspaceData) return
    const updatedConfig = { ...activeReqConfig, [field]: value }
    setActiveReqConfig(updatedConfig)

    // Save to local workspaces tree
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

  // Option table handlers
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

    try {
      const res = await window.api.coap.send(activeReqConfig)
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

  // Trigger GET Observe Stream
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

    try {
      const teardown = window.api.coap.observe(activeReqConfig, (update) => {
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

  // Cancel on-the-fly standard request
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

  // Open modals helper
  const openInputModal = (type, targetId) => {
    setModalType(type)
    setModalTargetId(targetId)
    setIsModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {workspaceData ? (
        // ACTIVE WORKSPACE VIEW
        <>
          {/* LEFT SIDEBAR: explorer */}
          <aside className="w-80 border-r border-white/5 bg-slate-950/80 flex flex-col justify-between">
            <div>
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

              {/* List of collections & requests */}
              <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collections</span>
                  <button 
                    onClick={() => openInputModal('collection', '')}
                    className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded hover:bg-white/10 transition text-slate-300"
                  >
                    + Folder
                  </button>
                </div>

                {workspaceData.collections.map(col => (
                  <div key={col.id} className="mb-4">
                    <div className="flex justify-between items-center py-1 group">
                      <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                        <span className="text-amber-500 text-base">📁</span>
                        <span className="truncate">{col.name}</span>
                      </div>
                      <button 
                        onClick={() => openInputModal('request', col.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-indigo-400 hover:text-indigo-300 transition"
                      >
                        + Add Req
                      </button>
                    </div>

                    <ul className="pl-4 mt-1 border-l border-white/5 space-y-1">
                      {col.requests.map(req => (
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
              </div>
            </div>

            <div className="p-4 border-t border-white/5 text-xs text-slate-500 text-center">
              CoapNode v1.0.0 &bull; Local Client
            </div>
          </aside>

          {/* CENTRAL / RIGHT PANELS */}
          <main className="flex-1 flex flex-col bg-slate-900/50">
            {activeReqConfig ? (
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

                  {/* URL Input */}
                  <input
                    type="text"
                    value={activeReqConfig.url}
                    onChange={(e) => handleUpdateReqField('url', e.target.value)}
                    placeholder="coap://localhost:5683/resource"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
                  />

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

                {/* Main content grid: Request Config (Left) & Response (Right) */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Left Config Panel */}
                  <div className="w-1/2 border-r border-white/5 flex flex-col overflow-hidden">
                    <div className="flex border-b border-white/5 bg-slate-950/10">
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
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-900/10">
                      
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
                                  onChange={(e) => handleUpdateRow('queryParams', idx, 'key', e.target.value)}
                                  placeholder="Key"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
                                />
                                <input
                                  type="text"
                                  value={row.value}
                                  onChange={(e) => handleUpdateRow('queryParams', idx, 'value', e.target.value)}
                                  placeholder="Value"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
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

                      {/* Headers / Options Table */}
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
                                  onChange={(e) => handleUpdateRow('headers', idx, 'key', e.target.value)}
                                  placeholder="e.g. Content-Format"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
                                />
                                <input
                                  type="text"
                                  value={row.value}
                                  onChange={(e) => handleUpdateRow('headers', idx, 'value', e.target.value)}
                                  placeholder="e.g. application/json"
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
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
                                No options added. Note: default settings will be resolved by the engine.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Body */}
                      {requestTab === 'body' && (
                        <div className="h-full flex flex-col">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Payload</label>
                          <textarea
                            value={activeReqConfig.payload || ''}
                            onChange={(e) => handleUpdateReqField('payload', e.target.value)}
                            placeholder="Raw text payload to send (POST/PUT)..."
                            className="flex-1 min-h-[300px] w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-indigo-500/50 font-mono resize-none"
                          />
                        </div>
                      )}

                      {/* Pre-Request Script */}
                      {requestTab === 'preScript' && (
                        <div className="h-full flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pre-Request Script (NodeJS sandbox)</label>
                            <span className="text-[10px] text-slate-500 italic">Access: request.payload, request.url, console.log</span>
                          </div>
                          <textarea
                            value={activeReqConfig.preScript || ''}
                            onChange={(e) => handleUpdateReqField('preScript', e.target.value)}
                            placeholder="// Write pre-request script here...&#10;request.payload = JSON.stringify({ updated: true });"
                            className="flex-1 min-h-[300px] w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-indigo-200 outline-none focus:border-indigo-500/50 font-mono resize-none"
                          />
                        </div>
                      )}

                      {/* Post-Request Script */}
                      {requestTab === 'postScript' && (
                        <div className="h-full flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Post-Request Script (NodeJS sandbox)</label>
                            <span className="text-[10px] text-slate-500 italic">Access: response.code, response.payload, console.log</span>
                          </div>
                          <textarea
                            value={activeReqConfig.postScript || ''}
                            onChange={(e) => handleUpdateReqField('postScript', e.target.value)}
                            placeholder="// Write post-request script here...&#10;console.log('Status code: ' + response.code);"
                            className="flex-1 min-h-[300px] w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-indigo-200 outline-none focus:border-indigo-500/50 font-mono resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Response Panel */}
                  <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="flex border-b border-white/5 bg-slate-950/10">
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
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col">
                      {errorText && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-mono">
                          {errorText}
                        </div>
                      )}

                      {/* Standard Output */}
                      {responseTab === 'body' && (
                        <div className="flex-1 flex flex-col">
                          {response ? (
                            <div className="flex-1 flex flex-col">
                              <div className="flex gap-4 items-center mb-3 bg-white/5 border border-white/5 p-3 rounded-lg text-xs">
                                <div>
                                  <span className="text-slate-400">Code: </span>
                                  <strong className="text-emerald-400 font-semibold">{response.code}</strong>
                                </div>
                                <div className="w-px h-3 bg-white/10" />
                                <div>
                                  <span className="text-slate-400">Time: </span>
                                  <strong className="text-slate-200 font-semibold">{response.duration} ms</strong>
                                </div>
                              </div>

                              <textarea
                                readOnly
                                value={response.payload}
                                className="flex-1 min-h-[300px] w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-slate-200 outline-none font-mono resize-none focus:border-white/10"
                              />
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-sm">
                              {isRequesting ? 'Request pending...' : 'Send a request to see the response'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Options List */}
                      {responseTab === 'options' && (
                        <div>
                          {response?.options && response.options.length > 0 ? (
                            <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-950/20">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-white/5 border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                                    <th className="p-3">Option Header</th>
                                    <th className="p-3">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                  {response.options.map((opt, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02]">
                                      <td className="p-3 font-semibold text-indigo-400">{opt.key}</td>
                                      <td className="p-3 font-mono">{opt.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-slate-500 italic text-sm text-center mt-12">
                              No option headers returned
                            </div>
                          )}
                        </div>
                      )}

                      {/* Observe Stream log */}
                      {responseTab === 'observe' && (
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stream Notifications</label>
                            <span className="text-[10px] text-rose-400 animate-pulse font-medium">● ACTIVE STREAM</span>
                          </div>

                          <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 overflow-y-auto space-y-3 font-mono text-xs min-h-[300px]">
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
                        <div className="flex-1 flex flex-col">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sandbox Output Console</label>
                          <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 font-mono text-xs text-indigo-300 min-h-[300px] overflow-y-auto space-y-1">
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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-indigo-500/5">
                  C
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">No Active Request Selected</h2>
                <p className="text-slate-400 text-sm max-w-sm">
                  Choose a request from the collections tree on the sidebar, or create a folder collection to get started.
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
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono text-left">
                {errorText}
              </div>
            )}

            {/* Main Action */}
            <button
              onClick={handleSelectDirectory}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition rounded-xl font-semibold text-sm text-white tracking-wide shadow-lg shadow-indigo-500/15"
            >
              Open / Create Workspace Folder
            </button>

            {/* Recent Workspaces */}
            {globalConfig.recentPaths && globalConfig.recentPaths.length > 0 && (
              <div className="flex flex-col gap-2.5 text-left border-t border-white/5 pt-4">
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

      {/* CUSTOM NAME MODAL OVERLAYS */}
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

    </div>
  )
}
