import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, Settings2, Trash2, CheckCircle2, Cookie, Zap } from 'lucide-react'
import ReactDOM from 'react-dom'

export const SiteSettingsPopover = ({ activeTab }: { activeTab: any }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const [isClearing, setIsClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const hostname = React.useMemo(() => {
    if (!activeTab || !activeTab.url || activeTab.url === 'dashboard') return ''
    try {
      return new URL(activeTab.url).hostname
    } catch {
      return ''
    }
  }, [activeTab?.url])

  const origin = React.useMemo(() => {
    if (!activeTab || !activeTab.url || activeTab.url === 'dashboard') return ''
    try {
      return new URL(activeTab.url).origin
    } catch {
      return ''
    }
  }, [activeTab?.url])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        // If they click inside the popover itself (which is portaled), don't close
        const popover = document.getElementById('site-settings-popover')
        if (popover && popover.contains(e.target as Node)) return
        setIsOpen(false)
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleClearSiteData = () => {
    if (!origin) return
    setIsClearing(true)
    setCleared(false)
    window.electron.ipcRenderer.send('clear-site-data', origin)
    setTimeout(() => {
      setIsClearing(false)
      setCleared(true)
      // Reload tab to reflect cleared state
      const webview = document.getElementById(`webview-${activeTab.id}`) as any
      if (webview) webview.reload()
      setTimeout(() => setCleared(false), 2000)
    }, 600)
  }

  if (!hostname)
    return (
      <div className="w-8 h-full flex items-center justify-center text-text-secondary opacity-50 shrink-0">
        <Lock size={12} />
      </div>
    )

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setPopoverPos({ top: rect.bottom + 10, left: rect.left })
          }
          setIsOpen(!isOpen)
        }}
        className="w-8 h-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-colors shrink-0 rounded-l-xl"
      >
        <Lock size={12} />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            id="site-settings-popover"
            className="fixed z-[9999]"
            style={{
              top: popoverPos.top,
              left: popoverPos.left
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-[280px] bg-[#1a1a1e] border border-white/10 rounded-xl premium-shadow flex flex-col overflow-hidden text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={14} className="text-emerald-400" />
                  <span className="text-[13px] font-semibold">{hostname}</span>
                </div>
                <span className="text-[11px] text-white/50">Connection is secure</span>
              </div>

              {/* Main Options */}
              <div className="p-2 flex flex-col gap-1">
                <div className="px-3 py-2 flex items-center justify-between rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <Zap size={14} className="text-blue-400" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium">Autoplay</span>
                      <span className="text-[10px] text-white/50">Blocked</span>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <Shield size={14} className="text-purple-400" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium">Tracking Protection</span>
                      <span className="text-[10px] text-white/50">Enabled</span>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between rounded-lg hover:bg-white/5 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <Cookie size={14} className="text-orange-400" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium">Cross-Site Cookies</span>
                      <span className="text-[10px] text-white/50">Blocked</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 border-t border-white/5 bg-black/20 flex flex-col gap-1">
                <button
                  onClick={handleClearSiteData}
                  disabled={isClearing || cleared}
                  className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors text-[12px] font-medium disabled:opacity-50"
                >
                  {cleared ? <CheckCircle2 size={14} /> : <Trash2 size={14} />}
                  {cleared
                    ? 'Cleared & Reloading...'
                    : isClearing
                      ? 'Clearing...'
                      : 'Clear cookies and site data'}
                </button>
                <button className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors text-[12px] font-medium">
                  <Settings2 size={14} />
                  All Site Settings
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </>
  )
}
