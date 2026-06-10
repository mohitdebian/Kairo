import { Sidebar } from '../Sidebar/Sidebar'
import { BrowserView } from '../BrowserView/BrowserView'
import { CommandPalette } from '../CommandPalette/CommandPalette'
import { DevPanel } from '../DevPanel/DevPanel'
import { SettingsModal } from '../Settings/SettingsModal'
import { AIGroupPanel } from '../AI/AIGroupPanel'
import { useBrowserStore } from '../../store/useBrowserStore'
import { ShieldCheck, Minus, Square, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useEffect, useState } from 'react'

const WindowControls = () => {
  return (
    <div
      className="absolute top-0 right-0 h-full flex items-center no-drag z-[60] pr-2 bg-[var(--color-bg-primary)]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        onClick={() => window.electron.ipcRenderer.send('window-minimize')}
        className="w-11 h-full flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Minus size={14} />
      </button>
      <button
        onClick={() => window.electron.ipcRenderer.send('window-maximize')}
        className="w-11 h-full flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Square size={12} />
      </button>
      <button
        onClick={() => window.electron.ipcRenderer.send('window-close')}
        className="w-12 h-full flex items-center justify-center text-white/40 hover:bg-red-500 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export const AppLayout = () => {
  const [isTopBarHovered, setIsTopBarHovered] = useState(false)
  const activeTabId = useBrowserStore((state) => state.activeTabIds[0])
  const activeTabTitle = useBrowserStore(
    (state) => state.tabs.find((t) => t.id === activeTabId)?.title
  )
  const activeTabUrl = useBrowserStore((state) => state.tabs.find((t) => t.id === activeTabId)?.url)
  const isFullscreen = useBrowserStore((state) => state.isFullscreen)
  const isFindOpen = useBrowserStore((state) => state.isFindOpen)

  useEffect(() => {
    window.electron.ipcRenderer.send('toggle-native-find', activeTabId, isFindOpen)
  }, [isFindOpen, activeTabId])

  useEffect(() => {
    const handleFullscreenState = (isFullscreen: boolean) => {
      useBrowserStore.getState().setFullscreen(isFullscreen)
    }
    const handleNewTab = () => {
      useBrowserStore.getState().toggleCommandPalette(true)
    }

    const handleNewTabDOM = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault()
        handleNewTab(null)
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        useBrowserStore.getState().addTab({ title: 'History', url: 'kairo://history', workspaceId: useBrowserStore.getState().activeWorkspaceId })
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        useBrowserStore.getState().toggleDownloads()
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        useBrowserStore.getState().toggleCommandPalette(true)
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        useBrowserStore.getState().splitCurrentPane('horizontal')
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        useBrowserStore.getState().toggleFind(true)
      }
    }
    const handleOpenInSpace = (data: { url: string; spaceId: string }) => {
      console.log('handleOpenInSpace received:', data)
      const store = useBrowserStore.getState()
      let targetSpaceId = data.spaceId
      if (targetSpaceId === 'new') {
        targetSpaceId = `w${Date.now()}`
        store.addWorkspace({ id: targetSpaceId, name: 'New Space', icon: 'Layout', color: '#6366f1' })
        store.setActiveWorkspace(targetSpaceId)
      }
      store.addTab({ title: 'New Tab', url: data.url, workspaceId: targetSpaceId })
    }

    const handleBookmarkUrl = (url: string) => {
      console.log('Bookmark added:', url)
      alert(`Bookmarked: ${url}`)
    }

    const handleAddTabToFolder = (data: { url: string; folderId: string }) => {
      const store = useBrowserStore.getState()
      const folder = store.folders.find((f) => f.id === data.folderId)
      if (folder) {
        store.addTab({
          title: 'New Tab',
          url: data.url,
          workspaceId: folder.workspaceId,
          folderId: data.folderId
        })
      }
    }

    const handleOpenInSplit = (url: string) => {
      const store = useBrowserStore.getState()
      store.splitCurrentPane('horizontal', url)
    }

    const handleSaveToNotes = (data: { text: string; sourceUrl: string }) => {
      console.log('Saved to notes:', data.text)
      alert(
        `Saved to Notes:\n\n${data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text}`
      )
    }

    const handleDownloadStarted = (item: any) => {
      useBrowserStore.getState().addDownload({
        id: item.id,
        url: item.url,
        filename: item.filename,
        state: 'progressing',
        receivedBytes: 0,
        totalBytes: item.totalBytes,
        startTime: Date.now()
      })
      if (!useBrowserStore.getState().isDownloadsOpen) {
        useBrowserStore.getState().toggleDownloads()
      }
    }

    const handleDownloadProgress = (data: any) => {
      useBrowserStore.getState().updateDownload(data.id, {
        receivedBytes: data.receivedBytes,
        totalBytes: data.totalBytes
      })
    }

    const handleDownloadComplete = (data: any) => {
      useBrowserStore.getState().updateDownload(data.id, {
        state: data.state
      })
    }

    window.addEventListener('keydown', handleNewTabDOM)
    window.electron.ipcRenderer.on('window-fullscreen-state', handleFullscreenState)
    window.electron.ipcRenderer.on('shortcut-new-tab', handleNewTab)
    window.electron.ipcRenderer.on('shortcut-find-in-page', () => {
      useBrowserStore.getState().toggleFind(true)
    })
    window.electron.ipcRenderer.on('shortcut-find-in-page-close', () => {
      useBrowserStore.getState().toggleFind(false)
    })
    window.electron.ipcRenderer.on('open-in-space', handleOpenInSpace)
    window.electron.ipcRenderer.on('bookmark-url', handleBookmarkUrl)
    window.electron.ipcRenderer.on('add-tab-to-folder', handleAddTabToFolder)
    window.electron.ipcRenderer.on('open-in-split', handleOpenInSplit)
    window.electron.ipcRenderer.on('save-to-notes', handleSaveToNotes)
    window.electron.ipcRenderer.on('download-started', handleDownloadStarted)
    window.electron.ipcRenderer.on('download-progress', handleDownloadProgress)
    window.electron.ipcRenderer.on('download-complete', handleDownloadComplete)

    window.electron.ipcRenderer.send('sync-context-menu-state', {
      workspaces: useBrowserStore.getState().workspaces,
      folders: useBrowserStore.getState().folders
    })

    const unsubscribe = useBrowserStore.subscribe((state, prevState) => {
      if (state.workspaces !== prevState.workspaces || state.folders !== prevState.folders) {
        window.electron.ipcRenderer.send('sync-context-menu-state', {
          workspaces: state.workspaces,
          folders: state.folders
        })
      }
    })

    return () => {
      unsubscribe()
      window.removeEventListener('keydown', handleNewTabDOM)
      window.electron.ipcRenderer.removeAllListeners('window-fullscreen-state')
      window.electron.ipcRenderer.removeAllListeners('shortcut-new-tab')
      window.electron.ipcRenderer.removeAllListeners('shortcut-find-in-page')
      window.electron.ipcRenderer.removeAllListeners('open-in-space')
      window.electron.ipcRenderer.removeAllListeners('bookmark-url')
      window.electron.ipcRenderer.removeAllListeners('add-tab-to-folder')
      window.electron.ipcRenderer.removeAllListeners('open-in-split')
      window.electron.ipcRenderer.removeAllListeners('save-to-notes')
      window.electron.ipcRenderer.removeAllListeners('download-started')
      window.electron.ipcRenderer.removeAllListeners('download-progress')
      window.electron.ipcRenderer.removeAllListeners('download-complete')
    }
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative bg-black">
        {!isFullscreen && <Sidebar />}
        <AIGroupPanel />
        <main
          className={cn(
            'relative overflow-hidden bg-bg-primary flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]',
            isFullscreen
              ? 'fixed inset-0 z-[99999] bg-black'
              : 'flex-1 border-t border-l border-white/[0.03] shadow-2xl'
          )}
        >
          {!isFullscreen && (
            <div 
              onMouseEnter={() => setIsTopBarHovered(true)}
              onMouseLeave={() => setIsTopBarHovered(false)}
              className={cn(
                "absolute top-0 left-0 right-0 z-[1000] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden bg-[#131313] border-b border-white/[0.01]",
                isTopBarHovered ? "h-[40px] shadow-2xl border-white/[0.03]" : "h-[14px]"
              )}
            >
              {/* Visible handle to show where to hover */}
              {!isTopBarHovered && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[3px] bg-white/30 rounded-b-full pointer-events-none shadow-sm" />
              )}
              
              <div className={cn(
                "h-[40px] w-full drag-region flex items-center justify-between px-3 bg-[#131313] border-b border-white/[0.03] transition-opacity duration-200",
                isTopBarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
              <div className="flex items-center gap-1 no-drag">
                <button
                  onClick={() => window.electron.ipcRenderer.send('tab-go-back', activeTabId)}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={() => window.electron.ipcRenderer.send('tab-go-forward', activeTabId)}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <button
                  onClick={() => window.electron.ipcRenderer.send('tab-reload', activeTabId)}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors mr-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </div>

              {activeTabId && activeTabUrl && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] border border-white/[0.05] shadow-sm max-w-[400px] rounded-md cursor-pointer no-drag hover:bg-white/[0.04] transition-colors"
                  onClick={() => useBrowserStore.getState().toggleCommandPalette(true)}
                >
                  {activeTabUrl.startsWith('https://') && (
                    <ShieldCheck size={12} className="text-emerald-500/80" />
                  )}
                  <span className="text-[11px] font-medium text-white/60 truncate tracking-wide">
                    {activeTabTitle || new URL(activeTabUrl).hostname || 'Loading...'}
                  </span>
                </div>
              )}
              <WindowControls />
            </div>
            </div>
          )}
          <div className={cn('flex-1 relative overflow-hidden')}>
            <div
              className={cn(
                'w-full h-full relative overflow-hidden bg-black transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
                !isFullscreen && (isTopBarHovered ? 'pt-[40px]' : 'pt-[14px]')
              )}
            >
              <BrowserView />
            </div>
          </div>
        </main>
        {!isFullscreen && <DevPanel />}
      </div>
      <CommandPalette />
      <SettingsModal />
    </div>
  )
}
