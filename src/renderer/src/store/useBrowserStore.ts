import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { splitLeafNode, removeNode, replaceTabInLeaf, getAllTabIds, findNodeByTabId, createLeaf, findNode } from './layoutUtils'

export type SplitDirection = 'horizontal' | 'vertical'

export interface SplitNode {
  id: string
  type: 'tab' | 'split'
  direction?: SplitDirection
  children?: SplitNode[]
  sizes?: number[]
  tabId?: string
  sizeInParent?: number
}

export interface Tab {
  id: string
  url: string
  title: string
  workspaceId: string
  folderId?: string
  pinned?: boolean
  groupId?: string
  favicon?: string
  isLoading?: boolean
  isSleeping?: boolean
  lastActiveAt?: number
}

export interface Folder {
  id: string
  name: string
  workspaceId: string
  isExpanded: boolean
  parentFolderId?: string
  children: Array<{ kind: 'tab' | 'folder', id: string }>
}

export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
}

export interface TrackInfo {
  title: string
  artist: string
  artUrl: string
  isPlaying: boolean
  progress: number
  duration: number
}

export interface HistoryEntry {
  url: string
  title: string
  favicon?: string
  visitCount: number
  lastVisitAt: number
}

interface BrowserState {
  workspaces: Workspace[]
  activeWorkspaceId: string
  folders: Folder[]
  tabs: Tab[]
  activeTabIds: string[]
  isSplitMode: boolean
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
  isRightPanelOpen: boolean
  isCommandPaletteOpen: boolean
  isSettingsOpen: boolean
  isDraggingTab: boolean
  workspaceNotes: Record<string, string>
  searchEngine: 'google' | 'duckduckgo'
  sleepingTabsEnabled: boolean
  sleepingTabsTimeout: number // minutes
  setIsDraggingTab: (isDragging: boolean) => void
  setSleepingTabsEnabled: (enabled: boolean) => void
  setSleepingTabsTimeout: (minutes: number) => void
  putTabToSleep: (id: string) => void
  wakeTab: (id: string) => void
  duplicateTab: (id: string) => void
  layouts: Record<string, SplitNode> // mapping workspaceId to root SplitNode
  splitPane: (paneId: string, direction: SplitDirection, tabId?: string, insertBefore?: boolean) => void
  splitCurrentPane: (direction: SplitDirection, url?: string) => void
  closePane: (nodeId: string) => void
  resizePane: (parentId: string, sizes: number[]) => void
  moveTabToPane: (tabId: string, targetNodeId: string) => void
  
  closeOtherTabs: (id: string) => void
  
  history: Record<string, HistoryEntry>
  upsertHistory: (url: string, title?: string, favicon?: string) => void
  
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isFullscreen: boolean
  setFullscreen: (isFullscreen: boolean) => void
  
  // Music Player
  musicTabId: string | null
  isMusicPlayerOpen: boolean
  musicTrack: TrackInfo | null
  setMusicTabId: (tabId: string | null) => void
  toggleMusicPlayer: () => void
  setMusicTrack: (track: Partial<TrackInfo>) => void

  // Folder Actions
  createFolder: (name: string, workspaceId: string) => void
  deleteFolder: (id: string) => void
  renameFolder: (id: string, newName: string) => void
  toggleFolder: (id: string) => void
  reorderFolders: (newFolders: Folder[]) => void
  reorderWorkspaces: (newWorkspaces: Workspace[]) => void

  // Actions
  setActiveWorkspace: (id: string) => void
  addWorkspace: (workspace: Omit<Workspace, 'id'>) => void
  deleteWorkspace: (id: string) => void
  renameWorkspace: (id: string, newName: string) => void
  addTab: (tab: Omit<Tab, 'id'>) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  addTabToSplit: (id: string) => void
  removeTabFromSplit: (id: string) => void
  updateTabUrl: (id: string, url: string) => void
  updateTabTitle: (id: string, title: string) => void
  updateTabFavicon: (id: string, favicon: string) => void
  updateTabLoading: (id: string, isLoading: boolean) => void
  reorderTabs: (newTabs: Tab[]) => void
  moveTabToFolder: (tabId: string, folderId: string | undefined, targetId?: string) => void
  moveTabToWorkspace: (tabId: string, workspaceId: string) => void
  setPinned: (id: string, pinned: boolean) => void
  toggleSidebar: () => void
  toggleSidebarCollapse: () => void
  toggleRightPanel: () => void
  toggleCommandPalette: (open?: boolean) => void
  toggleSettings: () => void
  updateWorkspaceNote: (workspaceId: string, note: string) => void
  setSearchEngine: (engine: 'google' | 'duckduckgo') => void
}

const defaultWorkspaces: Workspace[] = [
  { id: '1', name: 'Default', icon: 'Code', color: '#9d7cd8' }
]

const initialTabs: Tab[] = [
  { id: 't1', url: 'https://start.duckduckgo.com', title: 'Dashboard', workspaceId: '1' }
]

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
  workspaces: defaultWorkspaces,
  activeWorkspaceId: '1',
  folders: [],
  tabs: initialTabs,
  activeTabIds: ['t1'],
  isSplitMode: false,
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isRightPanelOpen: false,
  isCommandPaletteOpen: false,
  isSettingsOpen: false,
  isDraggingTab: false,
  workspaceNotes: {},
  searchEngine: 'google',
  sleepingTabsEnabled: true,
  sleepingTabsTimeout: 30, // Default 30 minutes
  
  layouts: {},
  
  splitPane: (paneId: string, direction: SplitDirection, tabId?: string, insertBefore: boolean = false) => {
    const { layouts, activeWorkspaceId, tabs } = get()
    const layout = layouts[activeWorkspaceId]
    if (!layout) return
    
    let newTabId = tabId
    // If no tabId provided, clone the current pane's tab or create new
    if (!newTabId) {
      const targetNode = findNode(layout, paneId)
      if (targetNode && targetNode.type === 'tab' && targetNode.tabId) {
        const currentTab = tabs.find(t => t.id === targetNode.tabId)
        const id = `tab-${Date.now()}`
        newTabId = id
        set(state => ({
          tabs: [...state.tabs, {
            id,
            url: currentTab?.url || 'dashboard',
            title: currentTab?.title || 'New Tab',
            workspaceId: activeWorkspaceId
          }],
          activeTabIds: [id, ...state.activeTabIds.filter(t => t !== id)]
        }))
      }
    }
    
    if (newTabId) {
      // If the tab is already in the layout, we might want to remove it from its old position
      const oldNode = findNodeByTabId(layout, newTabId)
      
      let newLayout = splitLeafNode(layout, paneId, direction, newTabId, insertBefore)
      
      if (oldNode && oldNode.id !== paneId && tabId) { // only remove if we explicitly passed tabId (drag and drop)
        const removedLayout = removeNode(newLayout, oldNode.id)
        if (removedLayout) {
          newLayout = removedLayout
        }
      }
      
      set(state => ({
        layouts: {
          ...state.layouts,
          [activeWorkspaceId]: newLayout
        },
        isSplitMode: true,
        activeTabIds: [newTabId!, ...state.activeTabIds.filter(t => t !== newTabId!)]
      }))
    }
  },
  
  splitCurrentPane: (direction: SplitDirection, url?: string) => set((state) => {
    const layout = state.layouts[state.activeWorkspaceId]
    if (!layout) return state
    
    const focusedTabId = state.activeTabIds[0]
    if (!focusedTabId) return state
    
    const focusedNode = findNodeByTabId(layout, focusedTabId)
    if (!focusedNode) return state
    
    const newTabId = `t${Date.now()}`
    const newTabs = [...state.tabs, { id: newTabId, url: url || 'dashboard', title: 'New Tab', workspaceId: state.activeWorkspaceId, lastActiveAt: Date.now() }]
    
    const newLayout = splitLeafNode(layout, focusedNode.id, direction, newTabId)
    const newActiveTabIds = getAllTabIds(newLayout)
    
    return {
      layouts: { ...state.layouts, [state.activeWorkspaceId]: newLayout },
      tabs: newTabs,
      activeTabIds: newActiveTabIds,
      isSplitMode: newActiveTabIds.length > 1
    }
  }),
  
  closePane: (nodeId) => set((state) => {
    const layout = state.layouts[state.activeWorkspaceId]
    if (!layout) return state
    
    const newLayout = removeNode(layout, nodeId)
    if (!newLayout) return state // Cannot close the last pane, use closeTab instead if they want to clear it, but maybe we should allow it and replace with dashboard? Let's just leave it if it's the last one.
    
    const newActiveTabIds = getAllTabIds(newLayout)
    
    return {
      layouts: { ...state.layouts, [state.activeWorkspaceId]: newLayout },
      activeTabIds: newActiveTabIds,
      isSplitMode: newActiveTabIds.length > 1
    }
  }),
  
  resizePane: (parentId, sizes) => set((state) => {
    const layout = state.layouts[state.activeWorkspaceId]
    if (!layout) return state
    
    const updateSize = (node: SplitNode): SplitNode => {
      if (node.id === parentId) return { ...node, sizes }
      if (node.children) return { ...node, children: node.children.map(updateSize) }
      return node
    }
    
    return {
      layouts: { ...state.layouts, [state.activeWorkspaceId]: updateSize(layout) }
    }
  }),
  
  moveTabToPane: (tabId, targetNodeId) => set((state) => {
    const layout = state.layouts[state.activeWorkspaceId]
    if (!layout) return state
    
    // First, find if the tab is already in the layout somewhere else
    const oldNode = findNodeByTabId(layout, tabId)
    
    // Replace in the target node
    let newLayout = replaceTabInLeaf(layout, targetNodeId, tabId)
    
    // If it was in the layout somewhere else, remove the old node
    if (oldNode && oldNode.id !== targetNodeId) {
      const removedLayout = removeNode(newLayout, oldNode.id)
      if (removedLayout) {
        newLayout = removedLayout
      }
    }
    
    return {
      layouts: { ...state.layouts, [state.activeWorkspaceId]: newLayout },
      activeTabIds: [tabId, ...state.activeTabIds.filter(id => id !== tabId)]
    }
  }),

  history: {},
  upsertHistory: (url, title, favicon) => set((state) => {
    // Ignore invalid or empty URLs
    if (!url || url === 'dashboard' || url.startsWith('chrome://')) return state;
    
    const existing = state.history[url] || { 
      url, 
      title: title || url, 
      favicon, 
      visitCount: 0, 
      lastVisitAt: 0 
    }

    return {
      history: {
        ...state.history,
        [url]: {
          ...existing,
          title: title || existing.title,
          favicon: favicon || existing.favicon,
          visitCount: existing.visitCount + 1,
          lastVisitAt: Date.now()
        }
      }
    }
  }),
  sidebarWidth: 280,
  isFullscreen: false,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  musicTabId: null,
  isMusicPlayerOpen: false,
  musicTrack: null,

  setMusicTabId: (tabId) => set({ musicTabId: tabId }),
  toggleMusicPlayer: () => set((state) => ({ isMusicPlayerOpen: !state.isMusicPlayerOpen })),
  setMusicTrack: (track) => set((state) => ({ 
    musicTrack: state.musicTrack ? { ...state.musicTrack, ...track } : { title: 'Unknown', artist: 'Unknown', artUrl: '', isPlaying: false, progress: 0, duration: 100, ...track } 
  })),

  // Folder Actions
  createFolder: (name, workspaceId) => set((state) => ({
    folders: [...state.folders, { id: `f${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name, workspaceId, isExpanded: true, children: [] }]
  })),
  deleteFolder: (id) => set((state) => ({
    folders: state.folders.filter(f => f.id !== id),
    tabs: state.tabs.map(t => t.folderId === id ? { ...t, folderId: undefined } : t)
  })),
  renameFolder: (id, newName) => set((state) => ({
    folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
  })),
  toggleFolder: (id) => set((state) => ({
    folders: state.folders.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f)
  })),
  reorderFolders: (newFolders) => set({ folders: newFolders }),
  reorderWorkspaces: (newWorkspaces) => set({ workspaces: newWorkspaces }),

  setActiveWorkspace: (id) => set((state) => {
    const workspaceTabs = state.tabs.filter(t => t.workspaceId === id)
    let newActiveTabIds = state.activeTabIds
    
    const layout = state.layouts[id]
    if (layout) {
      newActiveTabIds = getAllTabIds(layout)
    } else if (workspaceTabs.length > 0) {
      const sortedTabs = [...workspaceTabs].sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))
      newActiveTabIds = [sortedTabs[0].id]
    } else {
      newActiveTabIds = []
    }

    return { 
      activeWorkspaceId: id,
      activeTabIds: newActiveTabIds,
      isSplitMode: newActiveTabIds.length > 1
    }
  }),
  addWorkspace: (workspace) => set((state) => ({
    workspaces: [...state.workspaces, { ...workspace, id: `w${Date.now()}` }]
  })),
  deleteWorkspace: (id) => set((state) => {
    const newWorkspaces = state.workspaces.filter(w => w.id !== id)
    const newActiveWorkspaceId = state.activeWorkspaceId === id ? (newWorkspaces[0]?.id || '') : state.activeWorkspaceId
    
    let newActiveTabIds = state.activeTabIds
    if (state.activeWorkspaceId === id) {
      const workspaceTabs = state.tabs.filter(t => t.workspaceId === newActiveWorkspaceId)
      if (workspaceTabs.length > 0) {
        const sortedTabs = [...workspaceTabs].sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))
        newActiveTabIds = [sortedTabs[0].id]
      } else {
        newActiveTabIds = []
      }
    }

    return {
      workspaces: newWorkspaces,
      activeWorkspaceId: newActiveWorkspaceId,
      activeTabIds: newActiveTabIds,
      isSplitMode: state.activeWorkspaceId === id ? false : state.isSplitMode,
      tabs: state.tabs.filter(t => t.workspaceId !== id),
      folders: state.folders.filter(f => f.workspaceId !== id)
    }
  }),
  renameWorkspace: (id, newName) => set((state) => ({
    workspaces: state.workspaces.map(w => w.id === id ? { ...w, name: newName } : w)
  })),
  
  addTab: (tabData) => set((state) => {
    const newTab: Tab = { ...tabData, id: `t${Date.now()}`, lastActiveAt: Date.now() }
    
    // When adding a new tab normally, we replace the entire layout with a single leaf
    const newLayout = createLeaf(newTab.id)
    
    return {
      tabs: [...state.tabs, newTab],
      activeTabIds: [newTab.id],
      layouts: { ...state.layouts, [newTab.workspaceId]: newLayout },
      isSplitMode: false
    }
  }),
  
  closeTab: (id) => set((state) => {
    const tabIndex = state.tabs.findIndex(t => t.id === id)
    if (tabIndex === -1) return state

    let activeTabIds = [...state.activeTabIds]
    let newLayouts = { ...state.layouts }
    
    if (activeTabIds.includes(id)) {
      activeTabIds = activeTabIds.filter(tId => tId !== id)
      
      // If the tab was in the layout, we must remove it from the layout tree
      const layout = state.layouts[state.activeWorkspaceId]
      if (layout) {
        // We need a helper to find the leaf ID for a tabId
        const node = findNodeByTabId(layout, id)
        if (node) {
          const newLayout = removeNode(layout, node.id)
          if (newLayout) {
             newLayouts[state.activeWorkspaceId] = newLayout
             activeTabIds = getAllTabIds(newLayout)
          } else {
             // If removing it destroyed the whole tree, create a new dashboard leaf
             const remainingTabsInWorkspace = state.tabs.filter(t => t.workspaceId === state.activeWorkspaceId && t.id !== id)
             const fallbackTabId = remainingTabsInWorkspace.length > 0 ? remainingTabsInWorkspace[remainingTabsInWorkspace.length - 1].id : undefined
             if (fallbackTabId) {
               newLayouts[state.activeWorkspaceId] = createLeaf(fallbackTabId)
               activeTabIds = [fallbackTabId]
             } else {
               const dashId = `t${Date.now()}`
               const newTabs = [...state.tabs]
               newTabs.push({ id: dashId, url: 'dashboard', title: 'New Tab', workspaceId: state.activeWorkspaceId, lastActiveAt: Date.now() })
               newLayouts[state.activeWorkspaceId] = createLeaf(dashId)
               activeTabIds = [dashId]
               return { 
                 tabs: newTabs.filter(t => t.id !== id), 
                 activeTabIds,
                 layouts: newLayouts,
                 musicTabId: state.musicTabId === id ? null : state.musicTabId,
                 isSplitMode: false
               }
             }
          }
        }
      } else {
        if (activeTabIds.length === 0) {
          const remainingTabsInWorkspace = state.tabs.filter(t => t.workspaceId === state.activeWorkspaceId && t.id !== id)
          if (remainingTabsInWorkspace.length > 0) {
            activeTabIds = [remainingTabsInWorkspace[remainingTabsInWorkspace.length - 1].id]
            newLayouts[state.activeWorkspaceId] = createLeaf(activeTabIds[0])
          }
        }
      }
    }
    
    return { 
      tabs: state.tabs.filter(t => t.id !== id), 
      activeTabIds,
      layouts: newLayouts,
      musicTabId: state.musicTabId === id ? null : state.musicTabId,
      isSplitMode: activeTabIds.length > 1
    }
  }),
  
  setActiveTab: (id) => set((state) => {
    const tab = state.tabs.find(t => t.id === id)
    if (!tab) return state
    
    // Replacing the active workspace's layout with just this tab
    const newLayout = createLeaf(id)
    
    return {
      activeTabIds: [id],
      layouts: { ...state.layouts, [tab.workspaceId]: newLayout },
      isSplitMode: false,
      tabs: state.tabs.map(t => t.id === id ? { ...t, isSleeping: false, lastActiveAt: Date.now() } : t)
    }
  }),
  
  addTabToSplit: (id) => set((state) => {
    const layout = state.layouts[state.activeWorkspaceId]
    if (!layout) return state
    // To simply add a tab to the split, we split the currently focused pane (activeTabIds[0]) horizontally.
    const focusedTabId = state.activeTabIds[0]
    if (!focusedTabId) return state
    const focusedNode = findNodeByTabId(layout, focusedTabId)
    if (!focusedNode) return state
    
    const newLayout = splitLeafNode(layout, focusedNode.id, 'horizontal', id)
    const newActiveTabIds = getAllTabIds(newLayout)
    
    return {
      layouts: { ...state.layouts, [state.activeWorkspaceId]: newLayout },
      activeTabIds: newActiveTabIds,
      isSplitMode: newActiveTabIds.length > 1
    }
  }),
  
  removeTabFromSplit: (id) => set((state) => {
    const layout = state.layouts[state.activeWorkspaceId]
    if (!layout) return state
    
    const node = findNodeByTabId(layout, id)
    if (!node) return state
    
    const newLayout = removeNode(layout, node.id)
    if (!newLayout) return state // don't close last pane
    
    const newActiveTabIds = getAllTabIds(newLayout)
    
    return {
      layouts: { ...state.layouts, [state.activeWorkspaceId]: newLayout },
      activeTabIds: newActiveTabIds,
      isSplitMode: newActiveTabIds.length > 1
    }
  }),

  updateTabUrl: (id, url) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, url } : t)
  })),

  updateTabTitle: (id, title) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, title } : t)
  })),

  updateTabFavicon: (id, favicon) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, favicon } : t)
  })),

  updateTabLoading: (id, isLoading) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, isLoading } : t)
  })),

  reorderTabs: (newTabs) => set({ tabs: newTabs }),

  moveTabToFolder: (tabId, folderId, targetId?: string) => set((state) => {
    const tabs = [...state.tabs]
    const tabIndex = tabs.findIndex(t => t.id === tabId)
    if (tabIndex === -1) return { tabs }
    
    // Create a new tab object to avoid mutating the original
    const tab = { ...tabs[tabIndex], folderId }
    tabs.splice(tabIndex, 1)
    
    if (targetId) {
      const targetIndex = tabs.findIndex(t => t.id === targetId)
      if (targetIndex !== -1) {
        tabs.splice(targetIndex, 0, tab)
        return { tabs }
      }
    }
    
    // If no targetId, append to the end of the folder's items (or workspace's items)
    tabs.push(tab)
    return { tabs }
  }),

  moveTabToWorkspace: (tabId, workspaceId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, workspaceId, folderId: undefined } : t)
  })),

  setPinned: (id, pinned) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, pinned } : t)
  })),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  toggleCommandPalette: (open) => set((state) => ({ 
    isCommandPaletteOpen: open !== undefined ? open : !state.isCommandPaletteOpen 
  })),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setIsDraggingTab: (isDragging: boolean) => set({ isDraggingTab: isDragging }),
  updateWorkspaceNote: (workspaceId, note) => set((state) => ({
    workspaceNotes: { ...state.workspaceNotes, [workspaceId]: note }
  })),
  setSearchEngine: (engine) => set({ searchEngine: engine }),
  setSleepingTabsEnabled: (enabled) => set({ sleepingTabsEnabled: enabled }),
  setSleepingTabsTimeout: (minutes) => set({ sleepingTabsTimeout: minutes }),
  putTabToSleep: (id) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, isSleeping: true } : t)
  })),
  wakeTab: (id) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, isSleeping: false, lastActiveAt: Date.now() } : t)
  })),
  duplicateTab: (id) => set((state) => {
    const tab = state.tabs.find(t => t.id === id)
    if (!tab) return state
    const newTab: Tab = { ...tab, id: `t${Date.now()}`, isSleeping: false, lastActiveAt: Date.now() }
    return {
      tabs: [...state.tabs, newTab],
      activeTabIds: [newTab.id],
      isSplitMode: false
    }
  }),
  closeOtherTabs: (id) => set((state) => {
    const tabToKeep = state.tabs.find(t => t.id === id)
    if (!tabToKeep) return state
    
    // Replace the layout for this workspace with just this tab
    const newLayout = createLeaf(id)
    
    return {
      tabs: state.tabs.filter(t => t.id === id || t.workspaceId !== tabToKeep.workspaceId),
      activeTabIds: [id],
      layouts: { ...state.layouts, [tabToKeep.workspaceId]: newLayout },
      isSplitMode: false,
      musicTabId: state.musicTabId === id ? state.musicTabId : null
    }
  }),
    }),
    {
      name: 'zen-browser-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        folders: state.folders,
        tabs: state.tabs,
        activeTabIds: state.activeTabIds,
        activeWorkspaceId: state.activeWorkspaceId,
        workspaceNotes: state.workspaceNotes,
        searchEngine: state.searchEngine,
        sidebarWidth: state.sidebarWidth,
        isSidebarCollapsed: state.isSidebarCollapsed,
        sleepingTabsEnabled: state.sleepingTabsEnabled,
        sleepingTabsTimeout: state.sleepingTabsTimeout
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return
          // On startup: mark all non-active tabs as sleeping for lazy restoration
          // Only the previously active tab(s) will create a WebContentsView
          const activeIds = state.activeTabIds
          state.tabs = state.tabs.map(t => {
            if (activeIds.includes(t.id)) {
              return { ...t, isSleeping: false, lastActiveAt: Date.now() }
            }
            return { ...t, isSleeping: true }
          })
        }
      }
    }
  )
)
