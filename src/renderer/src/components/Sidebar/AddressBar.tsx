import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, ArrowRight } from 'lucide-react'
import { useBrowserStore, Tab } from '../../store/useBrowserStore'
import { SiteSettingsPopover } from './SiteSettingsPopover'
import { cn } from '../../utils/cn'

interface AddressBarProps {
  primaryActiveTab?: Tab
}

interface Suggestion {
  id: string
  url: string
  title: string
  favicon?: string
  isTab: boolean
  tabId?: string
  score: number
}

export const AddressBar = ({ primaryActiveTab }: AddressBarProps) => {
  const store = useBrowserStore()
  const { history, tabs, activeWorkspaceId, searchEngine } = store
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isFocused) {
      setInputValue(primaryActiveTab?.url === 'dashboard' ? '' : (primaryActiveTab?.url || ''))
    }
  }, [primaryActiveTab?.url, primaryActiveTab?.id, isFocused])

  const suggestions = useMemo(() => {
    if (!inputValue.trim() || !isFocused) return []

    const query = inputValue.toLowerCase()
    const matches: Suggestion[] = []

    // 1. Check Open Tabs
    const openTabs = tabs.filter(t => t.url && t.url !== 'dashboard')
    openTabs.forEach(tab => {
      const titleMatch = (tab.title || '').toLowerCase().includes(query)
      const urlMatch = tab.url.toLowerCase().includes(query)
      
      if (titleMatch || urlMatch) {
        matches.push({
          id: `tab-${tab.id}`,
          url: tab.url,
          title: tab.title || tab.url,
          favicon: tab.favicon,
          isTab: true,
          tabId: tab.id,
          score: 1000 // Force tabs to the top
        })
      }
    })

    // 2. Check History
    Object.values(history).forEach(entry => {
      // Skip if already in open tabs match
      if (matches.some(m => m.url === entry.url)) return

      const titleMatch = entry.title.toLowerCase().includes(query)
      const urlMatch = entry.url.toLowerCase().includes(query)

      if (titleMatch || urlMatch) {
        let score = 0
        
        // Frequency
        score += Math.min(entry.visitCount * 10, 200)
        
        // Recency (max 200)
        const daysSinceVisit = (Date.now() - entry.lastVisitAt) / (1000 * 60 * 60 * 24)
        if (daysSinceVisit < 1) score += 200
        else if (daysSinceVisit < 7) score += 100
        else if (daysSinceVisit < 30) score += 50
        
        // Match quality
        if (titleMatch) score += 50
        if (urlMatch) score += 50
        // Exact prefix match bonus
        if (entry.title.toLowerCase().startsWith(query)) score += 100
        if (entry.url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').startsWith(query)) score += 150

        matches.push({
          id: `hist-${entry.url}`,
          url: entry.url,
          title: entry.title,
          favicon: entry.favicon,
          isTab: false,
          score
        })
      }
    })

    // Add search suggestion at the bottom
    const isUrl = inputValue.includes('.') && !inputValue.includes(' ')
    if (!isUrl) {
      matches.push({
        id: 'search',
        url: searchEngine === 'google' ? `https://google.com/search?q=${encodeURIComponent(inputValue)}` : `https://duckduckgo.com/?q=${encodeURIComponent(inputValue)}`,
        title: `Search ${searchEngine === 'google' ? 'Google' : 'DuckDuckGo'} for "${inputValue}"`,
        isTab: false,
        score: -1
      })
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 8)
  }, [inputValue, isFocused, history, tabs, searchEngine])

  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions.length, inputValue])

  const navigateTo = (url: string, isTab: boolean, tabId?: string) => {
    if (isTab && tabId) {
      store.setActiveTab(tabId)
    } else {
      let finalUrl = url
      if (url === 'search') return
      
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.includes('localhost') && finalUrl.includes('.')) {
        finalUrl = `https://${finalUrl}`
      } else if (!finalUrl.includes('://') && !finalUrl.includes('localhost')) {
        finalUrl = searchEngine === 'google' 
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
      setSelectedIndex(prev => (prev + 1) % (suggestions.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % (suggestions.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex]
        navigateTo(selected.url, selected.isTab, selected.tabId)
      } else {
        navigateTo(inputValue, false)
      }
    } else if (e.key === 'Escape') {
      inputRef.current?.blur()
      setIsFocused(false)
      setInputValue(primaryActiveTab?.url === 'dashboard' ? '' : (primaryActiveTab?.url || ''))
    }
  }

  return (
    <div className="relative w-full z-50">
      <div className={cn(
        "w-full bg-white/[0.02] border border-white/5 rounded-xl h-9 flex items-center shadow-inner transition-all duration-200",
        isFocused ? "border-[var(--color-accent)]/50 bg-black/40 ring-1 ring-[var(--color-accent)]/30" : "hover:bg-white/[0.04]"
      )}>
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
                  onClick={() => navigateTo(suggestion.url, suggestion.isTab, suggestion.tabId)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    index === selectedIndex ? "bg-[var(--color-accent)]/20" : "hover:bg-white/5"
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

                  {suggestion.isTab && (
                    <div className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30">
                      <span className="text-[9px] font-medium text-[var(--color-accent)] uppercase tracking-wider">Switch to Tab</span>
                    </div>
                  )}
                  
                  {index === selectedIndex && (
                    <ArrowRight size={14} className="text-[var(--color-accent)] flex-shrink-0 opacity-50" />
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
