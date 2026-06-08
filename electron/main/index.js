const { app, BrowserWindow, BrowserView, ipcMain } = require('electron')
const { join } = require('path')

// (Removed memory optimization command-line flags to fix Captcha and Site Isolation crashes)

let mainWindow = null
const tabs = new Map() // tabId -> BrowserView
let currentTabId = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  // Load React Frontend
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow?.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => mainWindow?.close())

  mainWindow.on('enter-full-screen', () => mainWindow.webContents.send('window-fullscreen-state', true))
  mainWindow.on('leave-full-screen', () => mainWindow.webContents.send('window-fullscreen-state', false))

  // Tab Management
  ipcMain.on('create-tab-view', (e, id, url) => {
    // If the tab already exists, just return
    if (tabs.has(id)) return

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: 'persist:main',
      }
    })

    tabs.set(id, view)
    
    // Set background color transparent or white
    view.setBackgroundColor('#ffffff')

    view.webContents.on('did-start-loading', () => {
      mainWindow.webContents.send('tab-loading', id, true)
    })

    view.webContents.on('did-stop-loading', () => {
      mainWindow.webContents.send('tab-loading', id, false)
    })

    view.webContents.on('page-title-updated', (e, title) => {
      mainWindow.webContents.send('tab-title-updated', id, title)
    })

    view.webContents.on('did-navigate', (e, url) => {
      mainWindow.webContents.send('tab-navigated', id, url)
    })

    view.webContents.on('did-navigate-in-page', (e, url) => {
      mainWindow.webContents.send('tab-navigated', id, url)
    })
    
    view.webContents.on('context-menu', (e, params) => {
      e.preventDefault()
      const { Menu, MenuItem, clipboard } = require('electron')
      const menu = new Menu()

      if (params.linkURL) {
        menu.append(new MenuItem({ label: 'Open Link in New Tab', click: () => {
          mainWindow.webContents.send('open-in-space', { url: params.linkURL, spaceId: 'current', sourceTabId: id })
        }}))
        menu.append(new MenuItem({ label: 'Copy Link Address', click: () => clipboard.writeText(params.linkURL) }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      if (params.mediaType === 'image' || params.hasImageContents) {
        menu.append(new MenuItem({ label: 'Save Image As...', click: () => view.webContents.downloadURL(params.srcURL) }))
        menu.append(new MenuItem({ label: 'Copy Image Address', click: () => clipboard.writeText(params.srcURL) }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      if (params.selectionText) {
        menu.append(new MenuItem({ label: 'Copy', click: () => view.webContents.copy() }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      if (params.isEditable) {
        menu.append(new MenuItem({ label: 'Cut', click: () => view.webContents.cut() }))
        menu.append(new MenuItem({ label: 'Copy', click: () => view.webContents.copy() }))
        menu.append(new MenuItem({ label: 'Paste', click: () => view.webContents.paste() }))
        menu.append(new MenuItem({ label: 'Select All', click: () => view.webContents.selectAll() }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      if (!params.linkURL && !params.selectionText && params.mediaType === 'none' && !params.isEditable) {
        menu.append(new MenuItem({ label: 'Back', enabled: view.webContents.canGoBack(), click: () => view.webContents.goBack() }))
        menu.append(new MenuItem({ label: 'Forward', enabled: view.webContents.canGoForward(), click: () => view.webContents.goForward() }))
        menu.append(new MenuItem({ label: 'Reload', click: () => view.webContents.reload() }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      menu.append(new MenuItem({ label: 'Inspect Element', click: () => view.webContents.inspectElement(params.x, params.y) }))
      menu.popup()
    })

    // Try to load external
    const loadUrl = url || 'https://google.com'
    view.webContents.loadURL(loadUrl).catch(e => console.error("Failed to load:", e))
  })

  ipcMain.on('update-tab-bounds', (e, id, bounds, visible) => {
    const view = tabs.get(id)
    if (!view) return

    if (visible) {
      if (currentTabId !== id) {
        if (currentTabId && tabs.has(currentTabId)) {
          mainWindow.removeBrowserView(tabs.get(currentTabId))
        }
        mainWindow.addBrowserView(view)
        currentTabId = id
      }
      view.setBounds({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) })
    } else {
      if (currentTabId === id) {
        mainWindow.removeBrowserView(view)
        currentTabId = null
      }
    }
  })

  ipcMain.on('destroy-tab-view', (e, id) => {
    const view = tabs.get(id)
    if (view) {
      if (currentTabId === id) {
        mainWindow.removeBrowserView(view)
        currentTabId = null
      }
      tabs.delete(id)
      
      // CRITICAL: Explicitly destroy the webContents to instantly free memory and CPU!
      // Otherwise, Chromium keeps the renderer process alive in the background running timers.
      try {
        if (!view.webContents.isDestroyed()) {
          // view.webContents.destroy() forces Chromium to immediately kill the renderer process associated with this view
          view.webContents.destroy()
        }
      } catch (err) {
        console.error("Failed to destroy webContents:", err)
      }
    }
  })

  ipcMain.on('tab-go-back', (e, id) => {
    const view = tabs.get(id)
    if (view && view.webContents.canGoBack()) view.webContents.goBack()
  })

  ipcMain.on('tab-go-forward', (e, id) => {
    const view = tabs.get(id)
    if (view && view.webContents.canGoForward()) view.webContents.goForward()
  })

  ipcMain.on('tab-navigate', (e, id, url) => {
    const view = tabs.get(id)
    if (view && url) {
      view.webContents.loadURL(url).catch(err => console.error("Failed to navigate:", err))
    }
  })

  ipcMain.on('tab-reload', (e, id) => {
    const view = tabs.get(id)
    if (view) {
      try {
        if (view.webContents.isCrashed()) {
          view.webContents.reload()
        } else {
          // Forcefully reload the page ignoring cache, bypassing broken service workers
          view.webContents.reloadIgnoringCache()
        }
      } catch (err) {
        console.error("Failed to forceful reload:", err)
      }
    }
  })
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
