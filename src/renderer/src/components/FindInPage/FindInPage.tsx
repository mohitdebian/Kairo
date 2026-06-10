import React, { useEffect, useRef } from 'react'
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'

export const FindInPage = () => {
  const isFindOpen = useBrowserStore((state) => state.isFindOpen)
  const findText = useBrowserStore((state) => state.findText)
  const findMatch = useBrowserStore((state) => state.findMatch)
  const activeTabId = useBrowserStore((state) => state.activeTabIds[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isFindOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isFindOpen])

  useEffect(() => {
    const handleFoundInPage = (_e: any, tabId: string, result: any) => {
      if (tabId === activeTabId) {
        useBrowserStore.getState().setFindMatch(result.activeMatchOrdinal, result.matches)
      }
    }
    
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('found-in-page-result', handleFoundInPage)
    }

    return () => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('found-in-page-result')
      }
    }
  }, [activeTabId])

  const handleSearch = (text: string, findNext: boolean = false, forward: boolean = true) => {
    useBrowserStore.getState().setFindText(text)
    if (!text) {
      useBrowserStore.getState().setFindMatch(0, 0)
      window.electron?.ipcRenderer?.send('stop-find-in-page', activeTabId, 'clearSelection')
      return
    }
    
    window.electron?.ipcRenderer?.send('find-in-page', activeTabId, text, {
      forward,
      findNext
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(findText, true, !e.shiftKey)
    } else if (e.key === 'Escape') {
      handleClose()
    }
  }

  const handleClose = () => {
    useBrowserStore.getState().toggleFind(false)
    window.electron?.ipcRenderer?.send('stop-find-in-page', activeTabId, 'clearSelection')
  }

  if (!isFindOpen) return null

  return (
    <div className="absolute top-3 right-8 z-[2000] w-[340px] h-10 bg-[#1f1f23] rounded-lg border border-white/10 shadow-2xl flex items-center px-3 gap-2">
      <Search size={14} className="text-white/40 shrink-0" />
      
      <input
        ref={inputRef}
        type="text"
        value={findText}
        onChange={(e) => handleSearch(e.target.value, false)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page"
        className="flex-1 h-full bg-transparent border-none outline-none text-white text-[13px] placeholder-white/30"
      />
      
      <span className="text-[12px] text-white/50 shrink-0 font-mono text-right min-w-[30px]">
        {findMatch.matches > 0 ? `${findMatch.activeMatchOrdinal}/${findMatch.matches}` : '0/0'}
      </span>
      
      <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1 shrink-0">
        <button
          onClick={() => handleSearch(findText, true, false)}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
          title="Previous (Shift+Enter)"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => handleSearch(findText, true, true)}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
          title="Next (Enter)"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 rounded text-white/60 transition-colors"
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
