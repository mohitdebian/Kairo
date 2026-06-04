import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Layout } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export const CommandPalette = () => {
  const isCommandPaletteOpen = useBrowserStore(state => state.isCommandPaletteOpen)
  const toggleCommandPalette = useBrowserStore(state => state.toggleCommandPalette)
  const workspaces = useBrowserStore(state => state.workspaces)
  const setActiveWorkspace = useBrowserStore(state => state.setActiveWorkspace)
  const addTab = useBrowserStore(state => state.addTab)
  const searchEngine = useBrowserStore(state => state.searchEngine)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
      }
      if (e.key === 'Escape') {
        toggleCommandPalette(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Listen to global IPC shortcut (from main process)
    const handleIpcShortcut = () => {
      toggleCommandPalette()
    }
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('shortcut-command-palette', handleIpcShortcut)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('shortcut-command-palette')
      }
    }
  }, [])

  // Options
  const actions = [
    {
      id: 'go-url',
      title: query.includes('.') && !query.includes(' ') ? `Open ${query.startsWith('http') ? query : `https://${query}`}` : `Search ${searchEngine === 'google' ? 'Google' : 'DuckDuckGo'} for "${query}"`,
      icon: Globe,
      type: 'Navigation',
      onSelect: () => {
        let url = query
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('localhost') && url.includes('.')) {
          url = `https://${url}`
        } else if (!url.includes('://') && !url.includes('localhost')) {
          url = searchEngine === 'google'
            ? `https://google.com/search?q=${encodeURIComponent(url)}`
            : `https://duckduckgo.com/?q=${encodeURIComponent(url)}`
        }
        addTab({ url, title: url, workspaceId: useBrowserStore.getState().activeWorkspaceId })
        toggleCommandPalette(false)
        setQuery('')
      }
    },
    ...workspaces.map(ws => ({
      id: `ws-${ws.id}`,
      title: `Switch to ${ws.name}`,
      icon: Layout,
      type: 'Workspace',
      onSelect: () => {
        setActiveWorkspace(ws.id)
        toggleCommandPalette(false)
        setQuery('')
      }
    }))
  ]

  const filteredActions = query.length > 0 
    ? actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.type === 'Navigation')
    : actions.filter(a => a.type !== 'Navigation')

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredActions.length)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length)
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      filteredActions[selectedIndex]?.onSelect()
    }
  }

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleCommandPalette(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-bg-secondary/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-4 border-b border-white/10">
              <Search size={20} className="text-text-secondary mr-3" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="bg-transparent border-none outline-none text-lg text-text-primary w-full placeholder-text-secondary/50"
              />
              <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1 text-xs text-text-secondary font-medium tracking-widest">
                ESC
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">No results found</div>
              ) : (
                <div className="space-y-1">
                  {filteredActions.map((action, idx) => {
                    const isSelected = selectedIndex === idx
                    return (
                      <div
                        key={action.id}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={action.onSelect}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors",
                          isSelected ? "bg-accent/20 text-text-primary" : "text-text-secondary hover:bg-white/5"
                        )}
                      >
                        <action.icon size={18} className={cn(isSelected ? "text-accent" : "text-text-secondary")} />
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-medium">{action.title}</span>
                          <span className="text-xs opacity-50">{action.type}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-white/5 px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>Navigate</span>
                <div className="flex gap-1">
                  <span className="bg-white/10 px-1 rounded text-[10px]">↑</span>
                  <span className="bg-white/10 px-1 rounded text-[10px]">↓</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>Select</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-medium tracking-widest">ENTER</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
