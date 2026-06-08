import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { m as motion} from 'framer-motion'
import { useBrowserStore } from '../../store/useBrowserStore'
import { Dashboard } from '../Dashboard/Dashboard'
import { HistoryPage } from '../History/HistoryPage'
import { Moon } from 'lucide-react'
import { SplitLayoutTree } from './SplitLayoutTree'

function sendTabBounds(tabId: string, el: HTMLElement, isVisible: boolean, notifyResize = false) {
  const domRect = el.getBoundingClientRect()
  // If we are hiding the tab, we must send the IPC message regardless of bounds
  // so the main process knows to remove it from the window.
  if ((domRect.width <= 0 || domRect.height <= 0) && isVisible) return
  window.electron.ipcRenderer.send('update-tab-bounds', tabId, {
    x: domRect.x,
    y: domRect.y,
    width: domRect.width,
    height: domRect.height
  }, isVisible, notifyResize)
}

const TabWebContents = React.memo(({ tab, isActive, isSplitMode }: { tab: any, isActive: boolean, isSplitMode: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isFullscreen = useBrowserStore((state) => state.isFullscreen)

  useEffect(() => {
    // Create the view in the main process
    window.electron.ipcRenderer.send('create-tab-view', tab.id, tab.url)

    // Cleanup on unmount
    return () => {
      window.electron.ipcRenderer.send('destroy-tab-view', tab.id)
    }
  }, [tab.id]) // Intentionally not including tab.url so it doesn't re-create on navigation

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let animationFrameId: number
    const syncFromContainer = (notifyResize = false) => {
      sendTabBounds(tab.id, el, isActive, notifyResize)
    }

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => syncFromContainer(false))
    })

    observer.observe(el)
    syncFromContainer(false)

    const handleWindowResize = () => syncFromContainer(false)
    window.addEventListener('resize', handleWindowResize)

    const handleForceSync = (targetTabId?: string) => {
      if (targetTabId && targetTabId !== tab.id) return
      syncFromContainer(true)
    }
    const removeForceSync = window.electron.ipcRenderer.on('sync-tab-bounds', handleForceSync)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleWindowResize)
      removeForceSync()
      window.electron.ipcRenderer.send('update-tab-bounds', tab.id, { x: 0, y: 0, width: 0, height: 0 }, false, false)
    }
  }, [tab.id, isActive, isSplitMode])

  // Fullscreen exit restores sidebar/chrome via CSS; ResizeObserver often misses that frame.
  useEffect(() => {
    const el = containerRef.current
    if (!el || isFullscreen) return

    const sync = (notifyResize: boolean) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => sendTabBounds(tab.id, el, isActive, notifyResize))
      })
    }

    sync(true)
    const timers = [50, 150, 350, 600].map((ms) =>
      window.setTimeout(() => sync(ms >= 150), ms)
    )

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [isFullscreen, tab.id, isActive])

  return (
    <div ref={containerRef} className="w-full h-full bg-transparent" />
  )
})

/** Placeholder shown for tabs that haven't been loaded yet (lazy restore / sleeping) */
const SleepingTabPlaceholder = ({ tab, onWake }: { tab: any, onWake: () => void }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-primary text-center select-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-8 h-8 rounded-lg" />
          ) : (
            <Moon size={28} className="text-[var(--color-accent)]/60" />
          )}
        </div>
        <div className="flex flex-col items-center gap-1.5 max-w-sm">
          <h3 className="text-base font-semibold text-white/90 truncate max-w-full">{tab.title || 'Sleeping Tab'}</h3>
          <p className="text-xs text-white/40 truncate max-w-full">{tab.url}</p>
        </div>
        <button
          onClick={onWake}
          className="mt-2 px-5 py-2 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 font-medium text-sm transition-colors border border-[var(--color-accent)]/20"
        >
          Wake Tab
        </button>
        <p className="text-[11px] text-white/25 mt-1">This tab was put to sleep to save memory</p>
      </motion.div>
    </div>
  )
}

const BrowserTab = React.memo(({ tabId, activeTabIds, isSplitMode, showDashboard, leafEl }: any) => {
  const tab = useBrowserStore(state => state.tabs.find(t => t.id === tabId))
  const isCommandPaletteOpen = useBrowserStore(state => state.isCommandPaletteOpen)
  const isSettingsOpen = useBrowserStore(state => state.isSettingsOpen)
  const wakeTab = useBrowserStore(state => state.wakeTab)
  
  const isActive = activeTabIds.includes(tabId)
  const isVisible = isActive && !showDashboard && !isCommandPaletteOpen && !isSettingsOpen
  const isSleeping = tab?.isSleeping === true

  const handleWake = useCallback(() => {
    wakeTab(tabId)
  }, [tabId, wakeTab])

  if (!tab || !tab.url || tab.url === 'dashboard' || tab.url === 'kairo://history') return null

  // In split mode, portal into the leaf element; otherwise render in-place
  const inner = (
    <div className={isSplitMode ? "w-full h-full relative overflow-hidden bg-transparent" : "absolute inset-0 bg-transparent"} style={{ pointerEvents: isVisible ? 'auto' : 'none', opacity: isVisible ? 1 : 0, zIndex: isVisible ? 10 : 0 }}>
      {isSleeping ? (
        <SleepingTabPlaceholder tab={tab} onWake={handleWake} />
      ) : (
        <TabWebContents tab={tab} isActive={isVisible} isSplitMode={isSplitMode} />
      )}
    </div>
  )

  if (isSplitMode && leafEl) {
    return createPortal(inner, leafEl)
  }

  // Non-split: render all tabs so they stay alive, but stack them
  return inner
})

export const BrowserView = () => {
  const tabIdsString = useBrowserStore(state => state.tabs.map(t => t.id).join(','))
  const tabIds = tabIdsString ? tabIdsString.split(',') : []
  const activeTabIds = useBrowserStore(state => state.activeTabIds)
  const isSplitMode = useBrowserStore(state => state.isSplitMode)
  const sleepingTabsEnabled = useBrowserStore(state => state.sleepingTabsEnabled)
  const sleepingTabsTimeout = useBrowserStore(state => state.sleepingTabsTimeout)
  
  const activeTabUrlsStr = useBrowserStore(state => state.activeTabIds.map(id => state.tabs.find(t => t.id === id)?.url || 'dashboard').join(','))
  const activeTabUrls = activeTabUrlsStr ? activeTabUrlsStr.split(',') : []

  useEffect(() => {
    const handleNav = (tabId: string, url: string) => {
      useBrowserStore.getState().updateTabUrl(tabId, url);
    };
    const handleTitle = (tabId: string, title: string) => {
      useBrowserStore.getState().updateTabTitle(tabId, title);
    };
    const handleFavicon = (tabId: string, favicon: string) => {
      useBrowserStore.getState().updateTabFavicon(tabId, favicon);
    };
    const handleLoading = (tabId: string, isLoading: boolean) => useBrowserStore.getState().updateTabLoading(tabId, isLoading);
    const handleMusic = (tabId: string, stateStr: string) => {
        try {
          const state = JSON.parse(stateStr);
          useBrowserStore.getState().setMusicTabId(tabId);
          useBrowserStore.getState().setMusicTrack(state);
        } catch (err) {}
    };


    const removeNav = window.electron.ipcRenderer.on('tab-navigated', handleNav);
    const removeTitle = window.electron.ipcRenderer.on('tab-title-updated', handleTitle);
    const removeFavicon = window.electron.ipcRenderer.on('tab-favicon-updated', handleFavicon);
    const removeLoading = window.electron.ipcRenderer.on('tab-loading', handleLoading);
    const removeMusic = window.electron.ipcRenderer.on('tab-music-state', handleMusic);


    return () => {
      removeNav();
      removeTitle();
      removeFavicon();
      removeLoading();
      removeMusic();
    }
  }, [])

  // Sleeping Tabs timer — check every 60 seconds for inactive tabs
  useEffect(() => {
    if (!sleepingTabsEnabled) return

    const interval = setInterval(() => {
      const state = useBrowserStore.getState()
      const now = Date.now()
      const timeoutMs = state.sleepingTabsTimeout * 60 * 1000

      state.tabs.forEach(tab => {
        // Don't sleep: active tabs, already sleeping tabs, pinned tabs, dashboard, or music tab
        if (
          state.activeTabIds.includes(tab.id) ||
          tab.isSleeping ||
          tab.pinned ||
          tab.url === 'dashboard' ||
          tab.id === state.musicTabId
        ) return

        const lastActive = tab.lastActiveAt || 0
        if (lastActive > 0 && now - lastActive > timeoutMs) {
          // Put this tab to sleep by destroying its WebContents via IPC
          window.electron.ipcRenderer.send('destroy-tab-view', tab.id)
          state.putTabToSleep(tab.id)
        }
      })
    }, 60_000) // Check every minute

    return () => clearInterval(interval)
  }, [sleepingTabsEnabled, sleepingTabsTimeout])

  const layout = useBrowserStore(state => state.layouts[state.activeWorkspaceId])
  // True split mode = layout has more than one tab pane (i.e. it's a split node, not just a single leaf)
  const isRealSplitMode = isSplitMode && layout?.type === 'split'

  const isDashboardOnly =
    activeTabIds.length === 1 && (!activeTabUrls[0] || activeTabUrls[0] === 'dashboard')
  const showDashboard = activeTabIds.length === 0 || isDashboardOnly

  const isHistoryOnly = activeTabUrls.length === 1 && activeTabUrls[0] === 'kairo://history'
  const showHistory = isHistoryOnly

  return (
    <div className="w-full h-full relative bg-transparent overflow-hidden">
      {isRealSplitMode ? (
        // Split mode: SplitLayoutTree provides layout containers; BrowserTabs portal into leaves
        <>
          <SplitLayoutTree node={layout} />
          {tabIds.map((tabId) => {
            const leafEl = document.getElementById(`split-leaf-${tabId}`)
            return (
              <BrowserTab
                key={tabId}
                tabId={tabId}
                activeTabIds={activeTabIds}
                isSplitMode={true}
                showDashboard={showDashboard}
                showHistory={showHistory}
                leafEl={leafEl}
              />
            )
          })}
        </>
      ) : (
        // Single-tab mode: render the active tab directly, filling the whole content area
        <>
          {tabIds.map((tabId) => (
            <BrowserTab
              key={tabId}
              tabId={tabId}
              activeTabIds={activeTabIds}
              isSplitMode={false}
              showDashboard={showDashboard}
              showHistory={showHistory}
              leafEl={null}
            />
          ))}
        </>
      )}

      {/* Dashboard Overlay */}
      {showDashboard && (
        <div className="absolute inset-0 z-40 bg-bg-primary">
          <Dashboard />
        </div>
      )}

      {/* History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-40 bg-bg-primary">
          <HistoryPage />
        </div>
      )}
    </div>
  )
}
