import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const TabContext = createContext(null)

export function useTabs() {
  return useContext(TabContext)
}

let _counter = 0
function generateId() {
  return 'tab_' + (++_counter) + '_' + Math.random().toString(36).substring(2, 9)
}

function createDefaultTabState() {
  return {
    splitPosition: 400,
    requestTab: 'params',
    responseTab: 'body',
    isRequesting: false,
    isObserving: false,
    observeTeardown: null,
    bindToMockPort: false,
    response: null,
    responseViewMode: 'text',
    scriptLogs: [],
    observeLogs: [],
    errorText: '',
    mockConsoleLogs: [],
    mockLogsTab: 'activity',
  }
}

export function TabProvider({ children }) {
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState('')

  // Ensure activeTabId is valid
  useEffect(() => {
    if (activeTabId && !tabs.some(t => t.id === activeTabId)) {
      if (tabs.length > 0) {
        setActiveTabId(tabs[tabs.length - 1].id)
      } else {
        setActiveTabId('')
      }
    }
  }, [tabs, activeTabId])

  const openTab = useCallback((type, id, title) => {
    let found = null
    setTabs(prev => {
      if (type === 'mock-config') {
        found = prev.find(t => t.type === 'mock-config')
      } else if (type === 'request') {
        found = prev.find(t => t.type === 'request' && t.requestId === id)
      } else if (type === 'environment') {
        found = prev.find(t => t.type === 'environment' && t.envId === id)
      } else if (type === 'mock-route') {
        found = prev.find(t => t.type === 'mock-route' && t.routeId === id)
      }

      if (found) {
        setActiveTabId(found.id)
        return prev
      }

      const newTab = {
        id: generateId(),
        type,
        title,
        requestId: type === 'request' ? id : null,
        envId: type === 'environment' ? id : null,
        routeId: type === 'mock-route' ? id : null,
        ...createDefaultTabState(),
      }

      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const tab = prev.find(t => t.id === tabId)
      if (!tab) return prev
      if (tab.observeTeardown) {
        try { tab.observeTeardown() } catch (e) {}
      }
      return prev.filter(t => t.id !== tabId)
    })
  }, [])

  const setActiveTab = useCallback((tabId) => {
    setActiveTabId(tabId)
  }, [])

  const updateTabState = useCallback((tabId, updates) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t))
  }, [])

  const getTabById = useCallback((tabId) => {
    return tabs.find(t => t.id === tabId)
  }, [tabs])

  const batchUpdateTabs = useCallback((updater) => {
    setTabs(prev => updater(prev))
  }, [])

  const activeTab = tabs.find(t => t.id === activeTabId) || null

  return (
    <TabContext.Provider value={{
      tabs,
      activeTabId,
      activeTab,
      openTab,
      closeTab,
      setActiveTab,
      updateTabState,
      getTabById,
      batchUpdateTabs,
    }}>
      {children}
    </TabContext.Provider>
  )
}
