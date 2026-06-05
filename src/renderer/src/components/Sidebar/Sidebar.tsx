import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  X,
  Settings,
  Pin,
  Folder as FolderIcon,
  Moon,
  SplitSquareHorizontal,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  RotateCw,
  Globe,
  Sparkles,
  Download
} from 'lucide-react'
import { useBrowserStore, Tab } from '../../store/useBrowserStore'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../utils/cn'
import { Virtuoso } from 'react-virtuoso'
import { MusicPlayer } from './MusicPlayer'
import { AddressBar } from './AddressBar'
import { Folder } from './Folder'
import { DownloadsPanel } from '../Downloads/DownloadsPanel'
import { useTabStripDnD } from '../../store/TabStripDnDController'
import { AIGroupSuggestionBanner } from '../AI/AIGroupSuggestionBanner'
import { useAIGroupStore } from '../../store/useAIGroupStore'

export const getTabTitle = (tab: Tab) => {
  if (!tab) return 'New Tab'
  if (tab.title && tab.title !== tab.url) return tab.title
  if (tab.url === 'dashboard') return 'New Tab'
  if (!tab.url) return 'New Tab'
  try {
    return new URL(tab.url).hostname.replace(/^www\./, '')
  } catch {
    return tab.url || 'New Tab'
  }
}

export const getTabFavicon = (tab: Tab) => {
  if (tab.favicon) return tab.favicon
  if (tab.url && tab.url !== 'dashboard' && tab.url.startsWith('http')) {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=64`
    } catch {
      return null
    }
  }
  return null
}

const FloatingTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({ x: rect.right + 10, y: rect.top + rect.height / 2 })
    setShow(true)
  }

  return (
    <div
      className="relative flex items-center justify-center w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{ left: coords.x, top: coords.y, transform: 'translateY(-50%)' }}
            className="fixed z-[100] px-3 py-1.5 rounded-lg bg-[#1a1a1e]/80 backdrop-blur-xl border border-white/10 text-white text-[12px] font-medium premium-shadow pointer-events-none whitespace-nowrap"
          >
            {text}
          </motion.div>,
          document.body
        )}
    </div>
  )
}

// ----------------------------------------
// Context Menu Store
// ----------------------------------------
const useContextMenu = () => {
  const [menu, setMenu] = useState<{ type: string; id: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const handleClick = () => setMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return { menu, setMenu }
}

// ----------------------------------------
// Workspace Dot
// ----------------------------------------
const WorkspaceDot = ({
  workspace,
  isActive,
  onClick,
  onContextMenu,
  onPointerDown,
  isDragging
}: any) => {
  return (
    <div
      className={cn(
        'relative group cursor-pointer p-1.5 flex items-center justify-center',
        isDragging && 'opacity-50'
      )}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, 'workspace', workspace.id)}
      onPointerDown={(e) => onPointerDown(e, 'workspace', workspace.id)}
      data-dnd-type="workspace"
      data-dnd-id={workspace.id}
    >
      <FloatingTooltip text={workspace.name}>
        <div
          className={cn(
            'w-3 h-3 rounded-full transition-all duration-300 shadow-sm',
            isActive
              ? 'ring-2 ring-white/20 scale-125'
              : 'opacity-60 hover:opacity-100 hover:scale-110'
          )}
          style={{ backgroundColor: workspace.color }}
        />
      </FloatingTooltip>
    </div>
  )
}

// ----------------------------------------
// Tab Item
// ----------------------------------------
const TabItem = React.memo(
  ({ tabId, isCollapsed, onContextMenu, onPointerDown, isDragging, hoverSide }: any) => {
    const tab = useBrowserStore((state) => state.tabs.find((t) => t.id === tabId))
    const isActive = useBrowserStore((state) => state.activeTabIds.includes(tabId))

    if (!tab) return null

    const onClick = () => useBrowserStore.getState().setActiveTab(tabId)
    const onClose = () => useBrowserStore.getState().closeTab(tabId)
    const onSplit = () => useBrowserStore.getState().addTabToSplit(tabId)

    if (isCollapsed) {
      return (
        <div
          className={cn('w-full flex justify-center py-1', isDragging && 'opacity-50')}
          onContextMenu={(e) => onContextMenu(e, 'tab', tab.id)}
          onPointerDown={(e) => onPointerDown(e, 'tab', tab.id)}
          data-dnd-type="tab"
          data-dnd-id={tab.id}
        >
          <FloatingTooltip text={getTabTitle(tab)}>
            <button
              onClick={onClick}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all relative group',
                isActive
                  ? 'bg-[var(--color-accent)]/15 text-white'
                  : 'hover:bg-white/10 text-text-secondary'
              )}
            >
              <div className="w-5 h-5 flex items-center justify-center overflow-hidden">
                {getTabFavicon(tab) ? (
                  <img
                    src={getTabFavicon(tab)!}
                    alt=""
                    className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const next = e.currentTarget.nextElementSibling as HTMLElement
                      if (next) next.style.display = 'flex'
                    }}
                  />
                ) : null}
                <span
                  className="text-[10px] uppercase font-bold"
                  style={{ display: getTabFavicon(tab) ? 'none' : 'flex' }}
                >
                  {getTabTitle(tab).charAt(0)}
                </span>
              </div>
            </button>
          </FloatingTooltip>
        </div>
      )
    }

    return (
      <div
        onClick={onClick}
        onContextMenu={(e) => onContextMenu(e, 'tab', tab.id)}
        onPointerDown={(e) => onPointerDown(e, 'tab', tab.id)}
        data-dnd-type="tab"
        data-dnd-id={tab.id}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer relative group',
          isActive
            ? 'bg-[var(--color-accent)]/15 text-white font-medium'
            : 'hover:bg-white/5 text-text-secondary hover:text-text-primary font-medium',
          isDragging && 'opacity-50 z-10',
          hoverSide === 'top' && 'shadow-[0_-2px_0_0_var(--color-accent)]',
          hoverSide === 'bottom' && 'shadow-[0_2px_0_0_var(--color-accent)]',
          hoverSide === 'left' && 'shadow-[-2px_0_0_0_var(--color-accent)]',
          hoverSide === 'right' && 'shadow-[2px_0_0_0_var(--color-accent)]'
        )}
      >
        <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative">
          {getTabFavicon(tab) ? (
            <img
              src={getTabFavicon(tab)!}
              alt=""
              className="w-3 h-3 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const next = e.currentTarget.nextElementSibling as HTMLElement
                if (next) next.style.display = 'block'
              }}
            />
          ) : null}
          <span
            className="text-[9px] uppercase font-bold"
            style={{ display: getTabFavicon(tab) ? 'none' : 'block' }}
          >
            {getTabTitle(tab).charAt(0)}
          </span>
        </div>
        <span className={cn('text-[13px] truncate flex-1', tab.isSleeping && 'opacity-50')}>
          {getTabTitle(tab)}
        </span>
        {tab.isSleeping && (
          <Moon size={11} className="text-[var(--color-accent)]/50 shrink-0 mr-1" />
        )}
        <div
          className={cn(
            'flex items-center gap-0.5 transition-opacity opacity-0 group-hover:opacity-100'
          )}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {!isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSplit()
              }}
              className="p-1 rounded-md hover:bg-[var(--color-accent)]/20 text-text-secondary hover:text-[var(--color-accent)] transition-colors"
            >
              <SplitSquareHorizontal size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-1 rounded-md hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }
)

const PinnedTabItem = React.memo(({ tabId, onContextMenu }: any) => {
  const tab = useBrowserStore(state => state.tabs.find(t => t.id === tabId))
  const isActive = useBrowserStore(state => state.activeTabIds[0] === tabId)
  
  if (!tab) return null
  
  return (
    <div
      onContextMenu={(e) => onContextMenu(e, 'tab', tabId)}
      onClick={() => useBrowserStore.getState().setActiveTab(tabId)}
      className="aspect-square rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center hover:bg-white/10 hover:shadow-lg transition-all cursor-pointer relative group"
    >
      {isActive && (
        <div className="absolute inset-0 bg-[var(--color-accent)]/10 rounded-xl" />
      )}
      {getTabFavicon(tab) ? (
        <img
          src={getTabFavicon(tab)!}
          alt=""
          className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
        />
      ) : (
        <Pin
          size={12}
          className={cn(
            isActive
              ? 'text-[var(--color-accent)]'
              : 'text-text-secondary'
          )}
        />
      )}
    </div>
  )
})

// ----------------------------------------
// MAIN SIDEBAR
// ----------------------------------------
export const Sidebar = () => {
  const workspaces = useBrowserStore(state => state.workspaces)
  const activeWorkspaceId = useBrowserStore(state => state.activeWorkspaceId)
  const isSidebarCollapsed = useBrowserStore(state => state.isSidebarCollapsed)
  const isSidebarOpen = useBrowserStore(state => state.isSidebarOpen)
  const sidebarWidth = useBrowserStore(state => state.sidebarWidth)
  const searchEngine = useBrowserStore(state => state.searchEngine)

  const rootTabIds = useBrowserStore(useShallow(state => 
    state.tabs.filter(t => t.workspaceId === activeWorkspaceId && !t.folderId && !t.pinned).map(t => t.id)
  ))
  const pinnedTabIds = useBrowserStore(useShallow(state => 
    state.tabs.filter(t => t.workspaceId === activeWorkspaceId && t.pinned).map(t => t.id)
  ))
  const activeFolders = useBrowserStore(useShallow(state => 
    state.folders.filter(f => f.workspaceId === activeWorkspaceId)
  ))
  const activeWorkspaceTabIds = useBrowserStore(useShallow(state => 
    state.tabs.filter(t => t.workspaceId === activeWorkspaceId).map(t => t.id)
  ))
  
  const primaryActiveTabId = useBrowserStore(state => state.activeTabIds[0])
  const primaryActiveTab = useBrowserStore(state => state.tabs.find(t => t.id === primaryActiveTabId))
  
  const { menu, setMenu } = useContextMenu()
  const aiGroupStore = useAIGroupStore()
  
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  
  const { dragSession, handlePointerDown, handlePointerMove, handlePointerUp } = useTabStripDnD()
  const isDraggingActive = dragSession !== null && (
    Math.abs(dragSession.current.x - dragSession.pointerStart.x) > 3 || 
    Math.abs(dragSession.current.y - dragSession.pointerStart.y) > 3
  )

  useEffect(() => {
    // If the user has multiple spaces and they appear to be the old defaults, remove them and migrate to 'Default'
    if (workspaces.length > 1 && workspaces.some(w => w.name === 'Personal' || w.name === 'Development')) {
      const store = useBrowserStore.getState()
      store.reorderWorkspaces([{ id: '1', name: 'Default', icon: 'Code', color: '#9d7cd8' }])
      store.setActiveWorkspace('1')
      const newTabs = store.tabs.map(t => ({ ...t, workspaceId: '1' }))
      store.reorderTabs(newTabs)
    }
  }, [])

  const [isResizing, setIsResizing] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = useBrowserStore.getState().sidebarWidth || 280
  }

  useEffect(() => {
    if (!isResizing) return
    const handleResize = (e: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(800, dragStartWidth.current + (e.clientX - dragStartX.current)))
      useBrowserStore.getState().setSidebarWidth(newWidth)
    }
    const handleResizeEnd = () => setIsResizing(false)
    window.addEventListener('mousemove', handleResize)
    window.addEventListener('mouseup', handleResizeEnd)
    return () => {
      window.removeEventListener('mousemove', handleResize)
      window.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing])

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent, type: string, id: string) => {
      e.preventDefault()
      e.stopPropagation()

      // Automatically expand the sidebar if it's collapsed so the menu has physical room to render
    if (useBrowserStore.getState().isSidebarCollapsed) {
      useBrowserStore.getState().toggleSidebarCollapse()
    }
    
    const menuWidth = 192 // w-48
    const menuMaxHeight = 220
    const actualWidth = useBrowserStore.getState().isSidebarCollapsed ? 220 : Math.max(220, useBrowserStore.getState().sidebarWidth || 280)
    const maxX = Math.max(10, actualWidth - menuWidth - 8)
    const clampedY = Math.min(e.clientY, window.innerHeight - menuMaxHeight)
    setMenu({ type, id, x: Math.min(e.clientX, maxX), y: clampedY })
  }, [setMenu])

  const getActiveWebview = (): any | null => {
    if (!primaryActiveTabId) return null
    return document.getElementById(`webview-${primaryActiveTabId}`)
  }
  const handleReload = () => {
    if (primaryActiveTabId) {
      window.electron.ipcRenderer.send('tab-reload', primaryActiveTabId)
    }
  }

  // Handle global shortcuts and IPC from main process
  useEffect(() => {
    const handleShortcutReload = () => handleReload()
    const handleOpenInNewTab = (url: string) => {
      useBrowserStore.getState().addTab({ title: url, url, workspaceId: activeWorkspaceId })
    }

    window.electron.ipcRenderer.on('shortcut-reload', handleShortcutReload)
    window.electron.ipcRenderer.on('open-in-new-tab', handleOpenInNewTab)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('shortcut-reload')
      window.electron.ipcRenderer.removeAllListeners('open-in-new-tab')
    }
  }, [primaryActiveTabId, activeWorkspaceId])

  const handleBack = () => getActiveWebview()?.goBack()
  const handleForward = () => getActiveWebview()?.goForward()

  if (!isSidebarOpen) return null

  const handleSidebarContextMenu = (e: React.MouseEvent) => {
    // Open sidebar-level context menu when right-clicking on empty space
    // (not on a tab or folder — those handle their own context menus)
    const target = e.target as HTMLElement
    const isOnInteractive = target.closest('[data-dnd-type]')
    if (!isOnInteractive) {
      handleContextMenu(e, 'sidebar', 'root')
    }
  }

  const submitFolderRename = (folderId: string, newName: string) => {
    useBrowserStore.getState().renameFolder(folderId, newName)
  }

  const renderContextMenu = () => {
    if (!menu) return null
    return (
      <div
        className="fixed z-[999] bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px] py-1.5"
        style={{ top: menu.y, left: menu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {menu.type === 'sidebar' && (
          <>
            <button
              onClick={() => {
                useBrowserStore.getState().addTab({ title: 'New Tab', url: 'dashboard', workspaceId: activeWorkspaceId })
                setMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5"
            >
              <Plus size={13} className="text-white/40" />
              New Tab
            </button>
            <button
              onClick={() => {
                useBrowserStore.getState().createFolder('New Folder', activeWorkspaceId)
                setMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5"
            >
              <FolderIcon size={13} className="text-white/40" />
              New Folder
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              onClick={() => {
                const currentTabs = useBrowserStore.getState().tabs;
                aiGroupStore.runAnalysis(currentTabs.filter((t) => t.workspaceId === activeWorkspaceId))
                setMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5"
            >
              <Sparkles size={13} className="text-purple-400" />
              Group with AI
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              onClick={() => {
                useBrowserStore.getState().addWorkspace({ name: 'New Space', icon: 'Code', color: '#8b5cf6' })
                setMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5"
            >
              <Plus size={13} className="text-white/40" />
              New Space
            </button>
          </>
        )}
        {menu.type === 'folder' && (
          <>
            <button
              onClick={() => {
                setEditingFolderId(menu.id)
                const fName = useBrowserStore.getState().folders.find((f) => f.id === menu.id)?.name || ''
                setEditFolderName(fName)
                setMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5"
            >
              <FolderIcon size={13} className="text-white/40" />
              Rename Folder
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              onClick={() => {
                useBrowserStore.getState().deleteFolder(menu.id)
                setMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
            >
              <X size={13} />
              Delete Folder
            </button>
          </>
        )}
        {menu.type === 'tab' &&
          (() => {
            const tab = useBrowserStore.getState().tabs.find((t) => t.id === menu.id)
            return (
              <>
                {tab && (
                  <button
                    onClick={() => {
                      useBrowserStore.getState().setPinned(menu.id, !tab.pinned)
                      setMenu(null)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.08] hover:text-white flex items-center gap-2.5"
                  >
                    <Pin size={13} className="text-white/40" />
                    {tab.pinned ? 'Unpin Tab' : 'Pin Tab'}
                  </button>
                )}
                <div className="my-1 border-t border-white/[0.06]" />
                <button
                  onClick={() => {
                    useBrowserStore.getState().closeTab(menu.id)
                    setMenu(null)
                  }}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
                >
                  <X size={13} />
                  Close Tab
                </button>
              </>
            )
          })()}
        {menu.type === 'workspace' &&
          (() => {
            const ws = workspaces.find((w) => w.id === menu.id)
            return (
              <>
                {ws && workspaces.length > 1 && (
                  <button
                    onClick={() => {
                      useBrowserStore.getState().deleteWorkspace(menu.id)
                      setMenu(null)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
                  >
                    <X size={13} />
                    Delete Space
                  </button>
                )}
              </>
            )
          })()}
      </div>
    )
  }

  return (
    <>
      {renderContextMenu()}
      <motion.div
        initial={false}
        animate={{ width: isSidebarCollapsed ? 64 : Math.max(220, sidebarWidth || 280) }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="bg-[#09090b] border-r border-white/[0.03] h-full shrink-0 relative z-40 overflow-hidden flex flex-col"
        onContextMenu={handleSidebarContextMenu}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {!isSidebarCollapsed && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-white/20 z-[100] transition-colors delay-100"
          />
        )}

        {/* --- EXPANDED LAYOUT --- */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full flex flex-col transition-opacity duration-200',
            isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
          style={{ width: Math.max(220, sidebarWidth || 280) }}
        >
          <div className="h-10 flex items-center justify-between px-3 drag-region select-none relative z-50">
            <div className="flex items-center gap-1">
              <button
                onClick={() => useBrowserStore.getState().toggleSidebarCollapse()}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 no-drag"
                title="Collapse Sidebar"
              >
                <PanelLeft size={14} />
              </button>
              <button
                onClick={handleReload}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 no-drag"
                title="Reload Tab"
              >
                <RotateCw size={14} className={cn(primaryActiveTab?.isLoading && 'animate-spin')} />
              </button>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => useBrowserStore.getState().toggleCommandPalette()}
              className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 flex items-center gap-1.5"
            >
              <Search size={14} />
              <span className="text-[10px] tracking-widest font-mono opacity-50">⌘T</span>
            </button>
          </div>

          <div className="px-3 pb-4 relative z-50">
            <AddressBar primaryActiveTab={primaryActiveTab} />
          </div>

          <div
            className="flex-1 overflow-y-auto no-scrollbar px-3 relative flex flex-col pb-4 mt-2"
            onContextMenu={handleSidebarContextMenu}
          >
            <AIGroupSuggestionBanner />
            {pinnedTabIds.length > 0 && (
              <div className="mb-4 grid grid-cols-5 gap-2">
                {pinnedTabIds.map((tabId) => (
                  <PinnedTabItem key={tabId} tabId={tabId} onContextMenu={handleContextMenu} />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1 mb-2">
              {activeFolders.map((folder) => {
                const isDragOver =
                  dragSession?.hover?.id === folder.id && dragSession?.hover?.type === 'folder'
                return (
                  <Folder
                    key={folder.id}
                    folder={folder}
                    {...{
                      onToggle: () => useBrowserStore.getState().toggleFolder(folder.id),
                      onContextMenu: handleContextMenu,
                      editingFolderId: editingFolderId,
                      editFolderName: editFolderName,
                      setEditFolderName: setEditFolderName,
                      onSubmitRename: () => submitFolderRename(folder.id, editFolderName),
                      onCancelRename: () => setEditingFolderId(null),
                      onPointerDown: handlePointerDown,
                      isDragOver: isDragOver
                    }}
                    renderTab={(tabId: string) => (
                      <TabItem
                        key={tabId}
                        tabId={tabId}
                        isCollapsed={false}
                        onContextMenu={handleContextMenu}
                        onPointerDown={handlePointerDown}
                        isDragging={isDraggingActive && dragSession?.draggedId === tabId}
                        hoverSide={
                          dragSession?.hover?.id === tabId ? dragSession?.hover?.side : null
                        }
                      />
                    )}
                  />
                )
              })}
            </div>

            <div className="flex-1 flex flex-col min-h-[50px] gap-0.5">
              {rootTabIds.map((tabId) => (
                <TabItem
                  key={tabId}
                  tabId={tabId}
                  isCollapsed={false}
                  onContextMenu={handleContextMenu}
                  onPointerDown={handlePointerDown}
                  isDragging={isDraggingActive && dragSession?.draggedId === tabId}
                  hoverSide={dragSession?.hover?.id === tabId ? dragSession?.hover?.side : null}
                />
              ))}
            </div>
          </div>

          <MusicPlayer />

          {/* Bottom Controls */}
          <div className="px-3 py-4 border-t border-white/[0.03] flex items-center justify-between">
            {workspaces.length > 1 ? (
              <div className="flex items-center gap-1.5 overflow-hidden">
                {workspaces.map((ws) => (
                  <WorkspaceDot
                    key={ws.id}
                    workspace={ws}
                    isActive={activeWorkspaceId === ws.id}
                    onClick={() => useBrowserStore.getState().setActiveWorkspace(ws.id)}
                    onContextMenu={handleContextMenu}
                    onPointerDown={handlePointerDown}
                    isDragging={isDraggingActive && dragSession?.draggedId === ws.id}
                  />
                ))}
                <button
                  onClick={() =>
                    useBrowserStore.getState().addWorkspace({ name: 'New Space', icon: 'Code', color: '#8b5cf6' })
                  }
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-text-secondary hover:text-white transition-colors ml-1"
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    useBrowserStore.getState().addWorkspace({ name: 'New Space', icon: 'Code', color: '#8b5cf6' })
                  }
                  className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                  title="Add Workspace"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  useBrowserStore.getState().setSearchEngine(searchEngine === 'google' ? 'duckduckgo' : 'google')
                }
                className={cn(
                  'p-1.5 rounded-md',
                  searchEngine === 'google'
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-orange-400 bg-orange-500/10'
                )}
                title={`Search Engine: ${searchEngine === 'google' ? 'Google' : 'DuckDuckGo'}`}
              >
                <Globe size={14} />
              </button>
              <button
                onClick={() => useBrowserStore.getState().toggleSettings()}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5"
              >
                <Settings size={14} />
              </button>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-inner ml-1" />
            </div>
          </div>
        </div>

        {/* --- 64px COLLAPSED LAYOUT --- */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full w-[64px] flex flex-col items-center py-3 transition-opacity duration-200 z-10',
            isSidebarCollapsed ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <div className="flex flex-col gap-4 items-center drag-region w-full pt-1">
            <button
              onClick={() => useBrowserStore.getState().toggleSidebarCollapse()}
              className="text-text-secondary hover:text-text-primary no-drag"
            >
              <PanelLeft size={16} />
            </button>
            <button
              onClick={handleBack}
              className="text-text-secondary hover:text-text-primary no-drag"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleForward}
              className="text-text-secondary hover:text-text-primary no-drag"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleReload}
              className="text-text-secondary hover:text-text-primary no-drag"
            >
              <RotateCw size={14} className={cn(primaryActiveTab?.isLoading && 'animate-spin')} />
            </button>
          </div>

          <div className="w-8 h-px bg-white/10 my-4 shrink-0" />
          <MusicPlayer />
          <div className="w-8 h-px bg-white/10 my-4 shrink-0" />

          {/* Virtualized list of all tabs in active workspace */}
          <div className="flex flex-col flex-1 w-full no-drag relative overflow-hidden">
            <Virtuoso
              style={{ height: '100%', width: '100%' }}
              data={activeWorkspaceTabIds}
              itemContent={(_index, tabId) => (
                <div className="pb-2 flex justify-center w-full px-2">
                  <TabItem
                    key={tabId}
                    tabId={tabId}
                    isCollapsed={true}
                    onContextMenu={handleContextMenu}
                    onPointerDown={handlePointerDown}
                    isDragging={isDraggingActive && dragSession?.draggedId === tabId}
                    hoverSide={dragSession?.hover?.id === tabId ? dragSession?.hover?.side : null}
                  />
                </div>
              )}
            />
          </div>

          <div className="flex flex-col items-center mt-auto pt-4 no-drag w-full shrink-0 border-t border-white/[0.03]">
            <FloatingTooltip text="New Tab">
              <button
                onClick={() =>
                  useBrowserStore.getState().addTab({
                    title: 'Dashboard',
                    url: 'dashboard',
                    workspaceId: activeWorkspaceId
                  })
                }
                className="text-text-secondary hover:text-text-primary hover:bg-white/5 p-2 rounded-lg mb-2"
              >
                <Plus size={18} />
              </button>
            </FloatingTooltip>
            <FloatingTooltip text="Downloads">
              <button
                onClick={() => useBrowserStore.getState().toggleDownloads()}
                className="text-text-secondary hover:text-text-primary hover:bg-white/5 p-2 rounded-lg mb-2 relative"
              >
                <Download size={16} />
                {useBrowserStore.getState().downloads.some(d => d.state === 'progressing') && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </button>
            </FloatingTooltip>
            <FloatingTooltip text="Settings">
              <button
                onClick={() => useBrowserStore.getState().toggleSettings()}
                className="text-text-secondary hover:text-text-primary hover:bg-white/5 p-2 rounded-lg mb-4"
              >
                <Settings size={16} />
              </button>
            </FloatingTooltip>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-inner mb-2" />
          </div>
        </div>
      </motion.div>

      {isDraggingActive && dragSession && (
        <>
          {/* Prevent text selection and set grab cursor globally while dragging */}
          <style>{`body { user-select: none !important; cursor: grabbing !important; }`}</style>
          <div
            className="fixed pointer-events-none z-[9999] transition-none"
            style={{
              left: dragSession.current.x - dragSession.grabOffset.x,
              top: dragSession.current.y - dragSession.grabOffset.y,
              opacity: 0.85
            }}
          >
            {dragSession.kind === 'tab' &&
              (() => {
                const tab = useBrowserStore.getState().tabs.find((t) => t.id === dragSession.draggedId)
                if (!tab) return null
                return (
                  <div
                    className="bg-[#1a1a1e] border border-[var(--color-accent)]/30 shadow-2xl shadow-[var(--color-accent)]/10 rounded-xl px-3 py-2 flex items-center gap-2"
                    style={{ width: Math.max(180, (useBrowserStore.getState().sidebarWidth || 280) - 32) }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {getTabFavicon(tab) ? (
                        <img src={getTabFavicon(tab)!} alt="" className="w-3 h-3 object-contain" />
                      ) : (
                        <span className="text-[9px] uppercase font-bold">
                          {getTabTitle(tab).charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] truncate flex-1 font-medium text-white">
                      {getTabTitle(tab)}
                    </span>
                  </div>
                )
              })()}
            {dragSession.kind === 'folder' &&
              (() => {
                const folder = useBrowserStore.getState().folders.find((f) => f.id === dragSession.draggedId)
                if (!folder) return null
                return (
                  <div
                    className="bg-[#1a1a1e] border border-[var(--color-accent)]/30 shadow-2xl shadow-[var(--color-accent)]/10 rounded-xl px-3 py-2 flex items-center gap-2"
                    style={{ width: Math.max(180, (useBrowserStore.getState().sidebarWidth || 280) - 32) }}
                  >
                    <FolderIcon size={14} className="text-[var(--color-accent)]" />
                    <span className="text-[12px] font-semibold tracking-wide flex-1 truncate text-white">
                      {folder.name}
                    </span>
                  </div>
                )
              })()}
            {dragSession.kind === 'workspace' &&
              (() => {
                const ws = useBrowserStore.getState().workspaces.find((w) => w.id === dragSession.draggedId)
                if (!ws) return null
                return (
                  <div
                    className="w-4 h-4 rounded-full shadow-2xl"
                    style={{ backgroundColor: ws.color }}
                  />
                )
              })()}
          </div>
        </>
      )}
      
      <DownloadsPanel />
      {/* Trigger HMR */}
    </>
  )
}
