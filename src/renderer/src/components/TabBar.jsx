import React, { useRef, useEffect } from 'react'
import { useTabs } from '../contexts/TabContext'

const TAB_ICONS = {
  request: '▸',
  environment: '🌱',
  'mock-config': '🛠️',
  'mock-route': '↳',
}

const TAB_TYPE_LABELS = {
  request: 'Request',
  environment: 'Environment',
  'mock-config': 'Mock Server',
  'mock-route': 'Route',
}

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabs()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current && activeTabId) {
      const el = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }
  }, [activeTabId])

  if (tabs.length === 0) return null

  return (
    <div className="flex items-center bg-slate-950/90 border-b border-white/5 flex-shrink-0 overflow-hidden h-9">
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map(tab => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-white/5 whitespace-nowrap select-none transition shrink-0 min-w-0 ${
              tab.id === activeTabId
                ? 'bg-slate-800 text-slate-100 border-t-2 border-t-indigo-500'
                : 'bg-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border-t-2 border-t-transparent'
            }`}
          >
            <span className="flex-shrink-0 text-[10px]">{TAB_ICONS[tab.type] || '□'}</span>
            <span className="truncate max-w-[160px]">{tab.title}</span>
            <span className="text-[9px] text-slate-500 ml-auto hidden sm:inline">{TAB_TYPE_LABELS[tab.type]}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className={`flex-shrink-0 ml-1 w-4 h-4 flex items-center justify-center rounded text-[10px] transition-all duration-200
                ${tab.id === activeTabId
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
                  : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                }`}
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
