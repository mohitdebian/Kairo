import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Command, Zap, Search, MonitorPlay, FileText, Bot, Compass, Terminal, Code2, Globe } from 'lucide-react'
import bgImage from '../../assets/mountain-bg.png'
import { useBrowserStore } from '../../store/useBrowserStore'

export const Dashboard = () => {
  const activeTabId = useBrowserStore(state => state.activeTabIds[0])
  const updateTabUrl = useBrowserStore(state => state.updateTabUrl)
  const addTab = useBrowserStore(state => state.addTab)
  const activeWorkspaceId = useBrowserStore(state => state.activeWorkspaceId)
  const toggleCommandPalette = useBrowserStore(state => state.toggleCommandPalette)
  const searchEngine = useBrowserStore(state => state.searchEngine)
  const history = useBrowserStore(state => state.history)
  const tabs = useBrowserStore(state => state.tabs)
  const workspaces = useBrowserStore(state => state.workspaces)

  const quickAccessItems = useMemo(() => {
    return Object.values(history)
      .filter(entry => !entry.url.includes('localhost') && !entry.url.includes('chrome://'))
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 5)
  }, [history])

  const localDevItems = useMemo(() => {
    return Object.values(history)
      .filter(entry => entry.url.includes('localhost'))
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 4) // Show up to 4 local dev links
  }, [history])

  const continueContext = useMemo(() => {
    const validTabs = tabs.filter(t => t.url !== 'dashboard' && t.lastActiveAt)
    if (validTabs.length === 0) return null
    
    // Find the most recently active tab
    const mostRecentTab = validTabs.sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))[0]
    const workspace = workspaces.find(w => w.id === mostRecentTab.workspaceId)
    const tabsInWorkspace = tabs.filter(t => t.workspaceId === mostRecentTab.workspaceId && t.url !== 'dashboard')
    
    if (!workspace) return null
    
    const timeDiffMs = Date.now() - (mostRecentTab.lastActiveAt || Date.now())
    const hoursAgo = Math.floor(timeDiffMs / (1000 * 60 * 60))
    const minutesAgo = Math.floor(timeDiffMs / (1000 * 60))
    
    let timeAgoStr = 'just now'
    if (hoursAgo > 0) timeAgoStr = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
    else if (minutesAgo > 0) timeAgoStr = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`

    return {
      workspaceName: workspace.name,
      tabCount: tabsInWorkspace.length,
      timeAgo: timeAgoStr,
      tabId: mostRecentTab.id
    }
  }, [tabs, workspaces])

  const navigateTo = (url: string) => {
    let finalUrl = url
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.includes('localhost') && finalUrl.includes('.')) {
      finalUrl = `https://${finalUrl}`
    } else if (!finalUrl.includes('://') && !finalUrl.includes('localhost')) {
      finalUrl = searchEngine === 'google' 
        ? `https://google.com/search?q=${encodeURIComponent(finalUrl)}`
        : `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`
    }
    
    if (activeTabId) {
      updateTabUrl(activeTabId, finalUrl)
    } else {
      addTab({ title: finalUrl, url: finalUrl, workspaceId: activeWorkspaceId })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let url = e.currentTarget.value
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('localhost') && url.includes('.')) {
        url = `https://${url}`
      } else if (!url.includes('://') && !url.includes('localhost')) {
        url = searchEngine === 'google' 
          ? `https://google.com/search?q=${encodeURIComponent(url)}`
          : `https://duckduckgo.com/?q=${encodeURIComponent(url)}`
      }
      
      if (activeTabId) {
        updateTabUrl(activeTabId, url)
      } else {
        addTab({ title: url, url, workspaceId: activeWorkspaceId })
      }
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex-1 h-full relative overflow-hidden">
      {/* Mountain Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Dark Overlay for minimal readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-bg-primary via-bg-primary/90 to-bg-primary/60" />

      {/* Content Container */}
      <div className="absolute inset-0 z-10 w-full min-h-full flex flex-col items-center pt-32 px-6 pb-20 overflow-y-auto overflow-x-hidden">
        
        {/* Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 drop-shadow-2xl"
        >
          <h1 className="text-4xl font-medium tracking-tight mb-2 text-white">
            Good Evening, Mohit
          </h1>
          <p className="text-white/70 text-lg">
            What are we working on today?
          </p>
        </motion.div>

        {/* Command Input */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative w-full max-w-2xl mb-16 group"
        >
          <div className="absolute inset-0 bg-[#9d7cd8]/20 blur-2xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center shadow-2xl transition-all focus-within:border-[#9d7cd8]/50 focus-within:bg-black/60">
            <Search size={20} className="text-white/50 mr-3" />
            <input 
              type="text" 
              placeholder="Search or type a command..."
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-lg text-white w-full placeholder-white/50"
            />
            <button onClick={() => toggleCommandPalette()} className="flex items-center gap-1 bg-white/10 rounded px-2 py-1 text-xs text-white/70 font-medium tracking-widest border border-white/5 hover:bg-white/20 transition-colors">
              <Command size={12} /> T
            </button>
          </div>
        </motion.div>

        {/* Two Column Layout for the rest */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Quick Access & Dev Links */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 flex flex-col gap-8"
          >
            {quickAccessItems.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold text-text-secondary/50 mb-3 tracking-widest uppercase px-1">Quick Access</h2>
                <div className="grid grid-cols-3 gap-3">
                  {quickAccessItems.map((item) => (
                    <motion.button
                      key={item.url}
                      onClick={() => navigateTo(item.url)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-colors group relative overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center relative z-10 overflow-hidden">
                        {item.favicon ? (
                          <img src={item.favicon} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <Globe size={16} className="text-white/50" />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold tracking-wide text-text-secondary group-hover:text-text-primary transition-colors relative z-10 truncate w-full text-center">
                        {item.title}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {localDevItems.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold text-text-secondary/50 mb-3 tracking-widest uppercase px-1">Local Dev</h2>
                <div className="grid grid-cols-2 gap-3">
                  {localDevItems.map((item) => (
                    <div 
                      key={item.url}
                      onClick={() => navigateTo(item.url)}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer flex items-center gap-3 group"
                    >
                      <Terminal size={14} className="text-text-secondary group-hover:text-[var(--color-accent)]" />
                      <span className="text-xs font-medium text-text-secondary group-hover:text-white truncate">
                        {item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column: Continue */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Continue Where You Left Off */}
            {continueContext && (
              <div>
                <h2 className="text-xs font-semibold text-white/50 mb-4 tracking-wider uppercase px-1">Continue</h2>
                <div 
                  onClick={() => useBrowserStore.getState().setActiveTab(continueContext.tabId)}
                  className="p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 hover:bg-white/5 transition-colors cursor-pointer group shadow-xl"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center">
                      <Compass size={18} className="text-[var(--color-accent)]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white group-hover:text-[var(--color-accent)] transition-colors">{continueContext.workspaceName}</span>
                      <span className="text-xs text-white/50">{continueContext.tabCount} open tab{continueContext.tabCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Last active {continueContext.timeAgo} in the {continueContext.workspaceName} workspace.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
