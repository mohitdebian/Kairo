import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Search, Trash2, Globe, ShieldCheck } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'

export const HistoryPage = () => {
  const [history, setHistory] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const activeTabId = useBrowserStore((state) => state.activeTabIds[0])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    if (window.electron?.ipcRenderer) {
      const results = await window.electron.ipcRenderer.invoke('get-recent-history', 1000)
      setHistory(results)
    }
  }

  const handleDelete = async (url: string) => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('delete-history-entry', url)
      setHistory((prev) => prev.filter((item) => item.url !== url))
    }
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all history?')) {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('clear-history')
        setHistory([])
      }
    }
  }

  const filteredHistory = history.filter(
    (h) => h.url.toLowerCase().includes(query.toLowerCase()) || h.title.toLowerCase().includes(query.toLowerCase())
  )

  // Group by date
  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const date = new Date(item.lastVisited).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="w-full h-full bg-bg-primary text-text-primary overflow-y-auto pt-10">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Clock className="text-accent" size={24} />
            </div>
            <h1 className="text-2xl font-semibold">History</h1>
          </div>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Browsing Data
          </button>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search history..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {Object.keys(groupedHistory).length === 0 ? (
          <div className="text-center py-12 text-text-secondary">No history entries found.</div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(groupedHistory) as [string, any[]][]).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-text-secondary mb-4 px-2">{date}</h3>
                <div className="bg-bg-secondary border border-white/5 rounded-2xl overflow-hidden">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors group ${
                        idx !== items.length - 1 ? 'border-b border-white/5' : ''
                      }`}
                    >
                      <div
                        className="flex items-center gap-4 overflow-hidden cursor-pointer flex-1"
                        onClick={() => useBrowserStore.getState().updateTabUrl(activeTabId, item.url)}
                      >
                        <div className="text-xs text-text-secondary w-12 shrink-0">
                          {new Date(item.lastVisited).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {item.favicon ? (
                          <img src={item.favicon} className="w-4 h-4 rounded-sm" />
                        ) : (
                          <Globe className="w-4 h-4 text-text-secondary" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{item.title || item.url}</span>
                          <span className="text-xs text-text-secondary truncate">{item.url}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item.url)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg text-text-secondary hover:text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
