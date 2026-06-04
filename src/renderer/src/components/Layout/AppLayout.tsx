import { Sidebar } from '../Sidebar/Sidebar'
import { BrowserView } from '../BrowserView/BrowserView'
import { CommandPalette } from '../CommandPalette/CommandPalette'
import { DevPanel } from '../DevPanel/DevPanel'
import { SettingsModal } from '../Settings/SettingsModal'
import { AIGroupPanel } from '../AI/AIGroupPanel'
import { useBrowserStore } from '../../store/useBrowserStore'
import { ShieldCheck, Minus, Square, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useEffect } from 'react'


const WindowControls = () => {
  return (
    <div className="absolute top-0 right-0 h-full flex items-center no-drag z-[60] pr-2">
      <button onClick={() => window.electron.ipcRenderer.send('window-minimize')} className="w-11 h-full flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors">
        <Minus size={14} />
      </button>
      <button onClick={() => window.electron.ipcRenderer.send('window-maximize')} className="w-11 h-full flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors">
        <Square size={12} />
      </button>
      <button onClick={() => window.electron.ipcRenderer.send('window-close')} className="w-12 h-full flex items-center justify-center text-white/40 hover:bg-red-500 hover:text-white transition-colors rounded-xl">
        <X size={16} />
      </button>
    </div>
  )
}

export const AppLayout = () => {
  const activeTabId = useBrowserStore((state) => state.activeTabIds[0])
  const activeTabTitle = useBrowserStore((state) => state.tabs.find(t => t.id === activeTabId)?.title)
  const activeTabUrl = useBrowserStore((state) => state.tabs.find(t => t.id === activeTabId)?.url)
  const isFullscreen = useBrowserStore((state) => state.isFullscreen)
  


  useEffect(() => {
    const handleFullscreenState = (_: any, state: boolean) => {
      useBrowserStore.getState().setFullscreen(state)
    }
    const handleNewTab = () => {
      const store = useBrowserStore.getState()
      store.toggleCommandPalette(true)
    }
    
    const handleNewTabDOM = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault()
        handleNewTab()
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        useBrowserStore.getState().toggleCommandPalette(true)
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        useBrowserStore.getState().splitCurrentPane('horizontal')
      }
    }
    const handleOpenInSpace = (_: any, data: { url: string, spaceId: string }) => {
      useBrowserStore.getState().addTab({ title: 'New Tab', url: data.url, workspaceId: data.spaceId })
    }

    const handleBookmarkUrl = (_: any, url: string) => {
      console.log('Bookmark added:', url)
      alert(`Bookmarked: ${url}`)
    }

    const handleAddTabToFolder = (_: any, data: { url: string, folderId: string }) => {
      const store = useBrowserStore.getState()
      const folder = store.folders.find(f => f.id === data.folderId)
      if (folder) {
        store.addTab({ title: 'New Tab', url: data.url, workspaceId: folder.workspaceId, folderId: data.folderId })
      }
    }

    const handleOpenInSplit = (_: any, url: string) => {
      const store = useBrowserStore.getState()
      store.splitCurrentPane('horizontal', url)
    }

    const handleSaveToNotes = (_: any, text: string) => {
      console.log('Saved to notes:', text)
      alert(`Saved to Notes:\n\n${text.length > 50 ? text.substring(0, 50) + '...' : text}`)
    }

    window.addEventListener('keydown', handleNewTabDOM)
    window.electron.ipcRenderer.on('window-fullscreen-state', handleFullscreenState)
    window.electron.ipcRenderer.on('shortcut-new-tab', handleNewTab)
    window.electron.ipcRenderer.on('open-in-space', handleOpenInSpace)
    window.electron.ipcRenderer.on('bookmark-url', handleBookmarkUrl)
    window.electron.ipcRenderer.on('add-tab-to-folder', handleAddTabToFolder)
    window.electron.ipcRenderer.on('open-in-split', handleOpenInSplit)
    window.electron.ipcRenderer.on('save-to-notes', handleSaveToNotes)

    window.electron.ipcRenderer.send('sync-context-menu-state', {
      workspaces: useBrowserStore.getState().workspaces,
      folders: useBrowserStore.getState().folders,
    })
    
    const unsubscribe = useBrowserStore.subscribe((state, prevState) => {
      if (state.workspaces !== prevState.workspaces || state.folders !== prevState.folders) {
        window.electron.ipcRenderer.send('sync-context-menu-state', {
          workspaces: state.workspaces,
          folders: state.folders,
        })
      }
    })

    return () => {
      unsubscribe()
      window.removeEventListener('keydown', handleNewTabDOM)
      window.electron.ipcRenderer.removeAllListeners('window-fullscreen-state')
      window.electron.ipcRenderer.removeAllListeners('shortcut-new-tab')
      window.electron.ipcRenderer.removeAllListeners('open-in-space')
      window.electron.ipcRenderer.removeAllListeners('bookmark-url')
      window.electron.ipcRenderer.removeAllListeners('add-tab-to-folder')
      window.electron.ipcRenderer.removeAllListeners('open-in-split')
      window.electron.ipcRenderer.removeAllListeners('save-to-notes')
    }
  }, [])

  return (
    <div className={cn("absolute inset-0 flex flex-col bg-[#09090b] overflow-hidden", !isFullscreen && "rounded-2xl border border-white/20 shadow-2xl")}>
      <div className="flex-1 flex overflow-hidden relative">
        {!isFullscreen && <Sidebar />}
        <AIGroupPanel />
        <main className={cn(
            "relative overflow-hidden bg-bg-primary flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isFullscreen ? "fixed inset-0 z-[99999] bg-black" : "flex-1 rounded-tl-xl border-t border-l border-white/[0.03] shadow-2xl"
          )}>
            {!isFullscreen && (
              <div className="h-8 w-full shrink-0 drag-region flex items-center justify-center border-b border-white/[0.02] relative z-50 bg-bg-primary">
                {activeTabId && activeTabUrl && (
                  <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.02] border border-white/[0.05] shadow-sm max-w-[400px] backdrop-blur-md">
                    {activeTabUrl.startsWith('https://') && <ShieldCheck size={12} className="text-emerald-500/80" />}
                    <span className="text-[11px] font-medium text-white/60 truncate tracking-wide">
                      {activeTabTitle || new URL(activeTabUrl).hostname || 'Loading...'}
                    </span>
                  </div>
                )}
                <WindowControls />
              </div>
            )}
            <div className={cn(
              "flex-1 relative overflow-hidden",
              !isFullscreen && "pr-2 pb-2"
            )}>
              <div className={cn("w-full h-full relative overflow-hidden", !isFullscreen && "rounded-xl border border-white/10")}>
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
