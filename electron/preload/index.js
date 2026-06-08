const { contextBridge, ipcRenderer } = require('electron')

// Expose IPC properly without giving full access
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => {
      const validChannels = [
        'window-minimize', 'window-maximize', 'window-close',
        'create-tab-view', 'update-tab-bounds', 'destroy-tab-view',
        'tab-go-back', 'tab-go-forward', 'tab-reload', 'context-menu-action'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },
    invoke: (channel, ...args) => {
      const validChannels = ['tab-create']
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
      return Promise.resolve()
    },
    on: (channel, func) => {
      const validChannels = [
        'window-fullscreen-state',
        'tab-loading',
        'tab-title-updated',
        'tab-favicon-updated',
        'tab-navigated',
        'shortcut-new-tab',
        'open-in-space',
        'bookmark-url',
        'add-tab-to-folder',
        'open-in-split',
        'save-to-notes',
        'download-started',
        'download-progress',
        'download-complete',
        'tab-music-state',
        'sync-tab-bounds',
        'show-web-context-menu'
      ]
      if (validChannels.includes(channel)) {
        const subscription = (event, ...args) => func(...args)
        ipcRenderer.on(channel, subscription)
        return () => ipcRenderer.removeListener(channel, subscription)
      }
      return () => {}
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel)
    }
  }
})
