import React, { useState, useEffect, useRef } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Layout, Clock, Bookmark, Pin, Plus } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export const CommandPalette = () => {
  const isCommandPaletteOpen = useBrowserStore((state) => state.isCommandPaletteOpen)
  const toggleCommandPalette = useBrowserStore((state) => state.toggleCommandPalette)
  const workspaces = useBrowserStore((state) => state.workspaces)
  const setActiveWorkspace = useBrowserStore((state) => state.setActiveWorkspace)
  const addTab = useBrowserStore((state) => state.addTab)
  const searchEngine = useBrowserStore((state) => state.searchEngine)

  const [query, setQuery] = useState('')
  const [inlineSuggestion, setInlineSuggestion] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [omniboxResults, setOmniboxResults] = useState<any[]>([])

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

    const handleIpcShortcut = () => toggleCommandPalette()
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

  useEffect(() => {
    if (!query || query.trim() === '') {
      setOmniboxResults([])
      setSelectedIndex(0)
      setInlineSuggestion('')
      return
    }

    const timer = setTimeout(async () => {
      const activeTabs = useBrowserStore.getState().tabs
      const results = await window.electron.ipcRenderer.invoke('omnibox-search', query, activeTabs, [])
      setOmniboxResults(results || [])
      setSelectedIndex(0)

      let newSuggestion = ''
      if (query.trim() !== '' && results && results.length > 0) {
        for (let i = 0; i < Math.min(3, results.length); i++) {
          const result = results[i]
          if (result && result.url && result.type !== 'search') {
            let url = result.url.replace(/^https?:\/\/(www\.)?/, '')
            let q = query.replace(/^https?:\/\/(www\.)?/, '')
            
            if (url.toLowerCase().startsWith(q.toLowerCase()) && q.length > 0) {
              newSuggestion = query + url.slice(q.length)
              break
            }
          }
        }
      }
      setInlineSuggestion(newSuggestion)
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  // Base fallback actions
  const defaultActions = [
    {
      id: 'go-url',
      title: query.includes('.') && !query.includes(' ')
        ? `Open ${query.startsWith('http') ? query : `https://${query}`}`
        : `Search ${searchEngine === 'google' ? 'Google' : 'DuckDuckGo'} for "${query}"`,
      icon: Search,
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
    ...(workspaces || []).map((ws) => ({
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

  // Map omnibox IPC results to UI actions
  const omniboxActions = omniboxResults.map((r) => ({
    id: `omni-${r.id}`,
    title: r.title,
    subtitle: r.url,
    icon: r.type === 'history' ? Clock : r.type === 'bookmark' ? Bookmark : r.type === 'pinned' ? Pin : Globe,
    type: r.type.charAt(0).toUpperCase() + r.type.slice(1),
    onSelect: () => {
      // Record visit when selected
      window.electron.ipcRenderer.send('omnibox-visit', r.url)
      
      if (r.type === 'tab' || r.type === 'pinned') {
        useBrowserStore.getState().setActiveTab(r.id)
      } else {
        addTab({ url: r.url, title: r.title, workspaceId: useBrowserStore.getState().activeWorkspaceId })
      }
      toggleCommandPalette(false)
      setQuery('')
    }
  }))

  const actions = query.length > 0 
    ? [defaultActions[0], ...omniboxActions] // Include Search/Go as top result + omnibox matches
    : defaultActions.filter(a => a.type !== 'Navigation')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (inlineSuggestion && inlineSuggestion.toLowerCase().startsWith(query.toLowerCase())) {
        setQuery(inlineSuggestion)
        setInlineSuggestion('')
      } else {
        // Try to get URL from selected item, or fallback to first omnibox result
        let urlToFill = ''
        if (actions[selectedIndex] && 'subtitle' in actions[selectedIndex]) {
          urlToFill = (actions[selectedIndex] as any).subtitle
        } else if (omniboxActions.length > 0) {
          urlToFill = (omniboxActions[0] as any).subtitle
        }
        
        if (urlToFill) {
          setQuery(urlToFill.replace(/^https?:\/\/(www\.)?/, ''))
          setInlineSuggestion('')
        }
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % actions.length)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + actions.length) % actions.length)
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      actions[selectedIndex]?.onSelect()
    }
  }

  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (isCommandPaletteOpen) {
      // Focus after a short delay to ensure animation doesn't interfere
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isCommandPaletteOpen])

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => toggleCommandPalette(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-[#09090b]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-4 border-b border-white/10">
              <Search size={20} className="text-white/40 mr-3 shrink-0" />
              <div className="relative flex-1 flex items-center overflow-hidden">
                {inlineSuggestion && inlineSuggestion.toLowerCase().startsWith(query.toLowerCase()) && (
                  <div className="absolute inset-0 flex items-center text-lg pointer-events-none whitespace-pre overflow-hidden">
                    <span className="opacity-0">{query}</span>
                    <span className="text-white/30">{inlineSuggestion.slice(query.length)}</span>
                  </div>
                )}
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setInlineSuggestion('')
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search history, tabs, or type a command..."
                  className="relative z-10 bg-transparent border-none outline-none text-lg text-white w-full placeholder-white/30"
                />
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1 text-xs text-white/50 font-medium tracking-widest shrink-0 ml-3">ESC</div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
              {actions.length === 0 ? (
                <div className="p-8 text-center text-white/40">No results found</div>
              ) : (
                <div className="space-y-1">
                  {actions.map((action, idx) => {
                    const isSelected = selectedIndex === idx
                    return (
                      <div
                        key={action.id}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={action.onSelect}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors group',
                          isSelected ? 'bg-white/10' : 'hover:bg-white/[0.05]'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg',
                          isSelected ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'
                        )}>
                          <action.icon size={14} className={cn(isSelected ? 'text-white' : 'text-white/50')} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-white/90 truncate">{action.title}</span>
                          {'subtitle' in action && (action as any).subtitle && (
                            <span className="text-[11px] text-white/40 truncate">{(action as any).subtitle}</span>
                          )}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-white/30 px-2">
                          {action.type}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white/5 px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                <span>Navigate</span>
                <div className="flex gap-1">
                  <span className="bg-white/10 px-1 rounded">↑</span>
                  <span className="bg-white/10 px-1 rounded">↓</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                <span>Open</span>
                <span className="bg-white/10 px-2 py-0.5 rounded">ENTER</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
