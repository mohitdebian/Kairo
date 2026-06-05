import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, ArrowRight, ArrowLeft } from 'lucide-react'
import { useBrowserStore, Tab } from '../../store/useBrowserStore'
import { SiteSettingsPopover } from './SiteSettingsPopover'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../utils/cn'

interface AddressBarProps {
  primaryActiveTab?: Tab
}

interface OmniboxResult {
  id: string
  url: string
  title: string
  favicon?: string
  type: string
  tabId?: string
}


export const AddressBar = ({ primaryActiveTab }: AddressBarProps) => {
  const tabs = useBrowserStore(useShallow(state => state.tabs))
  const activeWorkspaceId = useBrowserStore(state => state.activeWorkspaceId)
  const searchEngine = useBrowserStore(state => state.searchEngine)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isFocused) {
      setInputValue(primaryActiveTab?.url === 'dashboard' ? '' : primaryActiveTab?.url || '')
    }
  }, [primaryActiveTab?.url, primaryActiveTab?.id, isFocused])

  const [suggestions, setSuggestions] = useState<OmniboxResult[]>([])

  useEffect(() => {
    if (!inputValue.trim() || !isFocused) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      if (window.electron?.ipcRenderer) {
        const results = await window.electron.ipcRenderer.invoke('omnibox-search', inputValue, tabs, [])
        
        // Add search suggestion at the bottom if it's not a direct URL
        const isUrl = inputValue.includes('.') && !inputValue.includes(' ')
        if (!isUrl) {
          results.push({
            id: 'search',
            url:
              searchEngine === 'google'
                ? `https://google.com/search?q=${encodeURIComponent(inputValue)}`
                : `https://duckduckgo.com/?q=${encodeURIComponent(inputValue)}`,
            title: `Search ${searchEngine === 'google' ? 'Google' : 'DuckDuckGo'} for "${inputValue}"`,
            type: 'search'
          })
        }
        setSuggestions(results)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [inputValue, isFocused, tabs, searchEngine])

  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions.length, inputValue])

  const navigateTo = (url: string, isTab: boolean, tabId?: string) => {
    // Record Omnibox visit for typedCount
    if (window.electron?.ipcRenderer && !isTab && url !== 'search') {
      window.electron.ipcRenderer.send('omnibox-visit', url)
    }

    if (isTab && tabId) {
      store.setActiveTab(tabId)
    } else {
      let finalUrl = url
      if (url === 'search') return

      if (
        !finalUrl.startsWith('http://') &&
        !finalUrl.startsWith('https://') &&
        !finalUrl.includes('localhost') &&
        finalUrl.includes('.')
      ) {
        finalUrl = `https://${finalUrl}`
      } else if (!finalUrl.includes('://') && !finalUrl.includes('localhost')) {
        finalUrl =
          searchEngine === 'google'
            ? `https://google.com/search?q=${encodeURIComponent(finalUrl)}`
            : `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`
      }

      if (primaryActiveTab?.id) {
        store.updateTabUrl(primaryActiveTab.id, finalUrl)
      } else {
        store.addTab({ title: finalUrl, url: finalUrl, workspaceId: activeWorkspaceId })
      }
    }

    inputRef.current?.blur()
    setIsFocused(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (suggestions.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % (suggestions.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex]
        navigateTo(selected.url, selected.type === 'open-tab', selected.tabId)
      } else {
        navigateTo(inputValue, false)
      }
    } else if (e.key === 'Escape') {
      inputRef.current?.blur()
      setIsFocused(false)
      setInputValue(primaryActiveTab?.url === 'dashboard' ? '' : primaryActiveTab?.url || '')
    }
  }

  return (
    <div className="relative w-full z-50 flex flex-col gap-2">
      <div
        className={cn(
          'relative overflow-hidden w-full bg-white/[0.02] border border-white/5 rounded-xl h-9 flex items-center shadow-inner transition-all duration-200',
          isFocused
            ? 'border-[var(--color-accent)]/50 bg-black/40 ring-1 ring-[var(--color-accent)]/30'
            : 'hover:bg-white/[0.04]'
        )}
      >
        <SiteSettingsPopover activeTab={primaryActiveTab} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search or enter address"
          onFocus={() => {
            setIsFocused(true)
            inputRef.current?.select()
          }}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 150)
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
          className="bg-transparent border-none outline-none text-[13px] text-text-primary w-full placeholder-text-secondary/50 font-medium px-2"
        />
        <AnimatePresence>
          {primaryActiveTab?.isLoading && (
            <motion.div
              key="loading-bar"
              initial={{ width: '0%', opacity: 1 }}
              animate={{ width: '60%', opacity: 1 }}
              exit={{ width: '100%', opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-50 rounded-r-full"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 text-text-secondary px-1">
        <button
          onClick={() => primaryActiveTab && window.electron?.ipcRenderer?.send('tab-go-back', primaryActiveTab.id)}
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={() => primaryActiveTab && window.electron?.ipcRenderer?.send('tab-go-forward', primaryActiveTab.id)}
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => primaryActiveTab && window.electron?.ipcRenderer?.send('tab-reload', primaryActiveTab.id)}
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors ml-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </div>

      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5, transition: { duration: 0.1 } }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto"
          >
            <div className="flex flex-col p-1.5 gap-0.5">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => navigateTo(suggestion.url, suggestion.type === 'open-tab', suggestion.tabId)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    index === selectedIndex ? 'bg-[var(--color-accent)]/20' : 'hover:bg-white/5'
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-md">
                    {suggestion.favicon ? (
                      <img src={suggestion.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                    ) : suggestion.id === 'search' ? (
                      <Search size={12} className="text-text-secondary" />
                    ) : (
                      <Globe size={12} className="text-text-secondary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[12px] text-white truncate font-medium">
                      {suggestion.title}
                    </span>
                    {suggestion.id !== 'search' && (
                      <span className="text-[10px] text-text-secondary truncate opacity-70 leading-tight">
                        {suggestion.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </span>
                    )}
                  </div>

                  {suggestion.type === 'open-tab' && (
                    <div className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30">
                      <span className="text-[9px] font-medium text-[var(--color-accent)] uppercase tracking-wider">
                        Switch to Tab
                      </span>
                    </div>
                  )}

                  {index === selectedIndex && (
                    <ArrowRight
                      size={14}
                      className="text-[var(--color-accent)] flex-shrink-0 opacity-50"
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
