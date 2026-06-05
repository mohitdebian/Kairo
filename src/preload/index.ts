import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onTabNavigated: (callback: (tabId: string, url: string) => void) =>
    ipcRenderer.on('tab-navigated', (_, tabId, url) => callback(tabId, url)),
  onTabTitleUpdated: (callback: (tabId: string, title: string) => void) =>
    ipcRenderer.on('tab-title-updated', (_, tabId, title) => callback(tabId, title)),
  onTabFaviconUpdated: (callback: (tabId: string, favicon: string) => void) =>
    ipcRenderer.on('tab-favicon-updated', (_, tabId, favicon) => callback(tabId, favicon)),
  importGoogleCookies: () => ipcRenderer.invoke('import-google-cookies')
}

// Expose IPC renderer with safe methods
const exposedIpcRenderer = {
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, listener: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => listener(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ipcRenderer: exposedIpcRenderer
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI,
    ipcRenderer: exposedIpcRenderer
  }
  // @ts-ignore (define in dts)
  window.api = api
}
