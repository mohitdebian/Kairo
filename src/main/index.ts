import { app, shell, BrowserWindow, ipcMain, WebContentsView } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Fix for Linux sandbox issue during development
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-gpu-memory-buffer-video-frames') // Hide harmless SharedImageBackingFactory GPU warnings
}

// --- Extreme RAM Optimization (Target: < 200MB) ---
// Disable Site Isolation (saves ~20-30% RAM per tab by allowing cross-site iframes in the same process)
app.commandLine.appendSwitch('disable-site-isolation-trials')
// Force Chromium into low-memory mode (disables some visual fluff and optimizes V8 GC for tight memory)
app.commandLine.appendSwitch('enable-low-end-device-mode')
// Limit the number of background renderer processes to force process-sharing between tabs
app.commandLine.appendSwitch('renderer-process-limit', '2')


// Remove the manual Client Hint disable so Google sees valid native modern browser hints.

let mainWindow: BrowserWindow
const tabViews = new Map<string, WebContentsView>()

function notifyWebContentsResize(view: WebContentsView): void {
  if (view.webContents.isDestroyed()) return
  view.webContents
    .executeJavaScript(
      `(() => {
        window.dispatchEvent(new Event('resize'));
        if (window.visualViewport) {
          window.visualViewport.dispatchEvent(new Event('resize'));
        }
      })();`
    )
    .catch(() => {})
}

function requestTabBoundsSync(tabId?: string): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('sync-tab-bounds', tabId)
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'Kairo',
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  // Basic Tracker & Ad Blocker for much faster page loads
  const filter = {
    urls: [
      '*://*.doubleclick.net/*',
      '*://*.google-analytics.com/*',
      '*://*.googletagmanager.com/*',
      '*://*.facebook.com/tr*',
      '*://*.criteo.com/*',
      '*://*.adsrvr.org/*',
      '*://*.taboola.com/*',
      '*://*.outbrain.com/*',
      '*://*.quantserve.com/*',
      '*://*.scorecardresearch.com/*',
      '*://*.amazon-adsystem.com/*'
    ]
  }
  
  const { session } = require('electron')
  session.defaultSession.webRequest.onBeforeRequest(filter, (_details, callback) => {
    callback({ cancel: true })
  })

  // Disable permissions that slow down initial page loads
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'notifications' || permission === 'geolocation') {
      callback(false) // auto-deny for faster rendering, adjust as needed
    } else {
      callback(true)
    }
  })

  // Clear the cache periodically (every 24 hours) to keep it fresh
  setInterval(async () => {
    try {
      await session.defaultSession.clearCache()
      console.log('Periodic cache clearing completed.')
    } catch (e) {
      console.error('Failed to clear cache:', e)
    }
  }, 24 * 60 * 60 * 1000)

  // Set the window to ignore menu bar for cleaner UI
  mainWindow.setMenuBarVisibility(false)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Global Fullscreen Listeners
  mainWindow.on('enter-full-screen', () => {
    // Intentionally do NOT send window-fullscreen-state true here.
    // If the user presses F11, they want the whole browser (with sidebar) in fullscreen.
    // We only send true during 'enter-html-full-screen' (e.g. YouTube video).
  })
  
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window-fullscreen-state', false)
    requestTabBoundsSync()
    setTimeout(() => requestTabBoundsSync(), 150)
    setTimeout(() => requestTabBoundsSync(), 400)
  })

  // Window Controls IPC
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Intercept global keyboard shortcuts for the window
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F11') {
        mainWindow.setFullScreen(!mainWindow.isFullScreen())
        event.preventDefault()
      }
      if (input.control || input.meta) {
        if (input.key.toLowerCase() === 'k' || input.key.toLowerCase() === 'l') {
          mainWindow.webContents.send('shortcut-command-palette')
          event.preventDefault()
        }
        if (input.key.toLowerCase() === 't') {
          mainWindow.webContents.send('shortcut-new-tab')
          event.preventDefault()
        }
        if (input.key.toLowerCase() === 'r') {
          mainWindow.webContents.send('shortcut-reload')
          event.preventDefault()
        }
      }
    }
  })

  // Also intercept for webviews (they emit before-input-event too if attached to window)
  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'webview') {
      // Force native dynamic User Agent (will use the clean one set in whenReady)
      contents.userAgent = app.userAgentFallback

      // Fix Popups and target="_blank" links
      contents.setWindowOpenHandler((details) => {
        // If it explicitly requests window features (like an OAuth popup)
        if (details.features) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              autoHideMenuBar: true,
              backgroundColor: '#09090b',
              titleBarStyle: 'hiddenInset',
            }
          }
        }
        
        // Shift+Click (new-window disposition) -> Open in split view
        if (details.disposition === 'new-window') {
          mainWindow.webContents.send('open-in-split', details.url)
          return { action: 'deny' }
        }
        
        // Otherwise, it's a standard link meant for a new tab (disposition: foreground-tab or background-tab)
        mainWindow.webContents.send('open-in-new-tab', details.url)
        return { action: 'deny' }
      })

      // Native Webpage Context Menu
      contents.on('context-menu', (contextEvent, params) => {
        contextEvent.preventDefault()
        const win = BrowserWindow.getAllWindows()[0]
        if (win) {
          let currentTabId = ''
          for (const [id, view] of tabViews.entries()) {
            if (view.webContents.id === contents.id) {
              currentTabId = id
              break
            }
          }
          
          // Wait, for <webview> tags, getBounds() doesn't exist on contents.
          // But Kairo doesn't use <webview> anyway, so this block is mostly fallback.
          win.webContents.send('show-web-context-menu', {
            ...params,
            tabId: currentTabId,
            menuX: params.x,
            menuY: params.y
          })
        }
      })

      contents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown' && (input.control || input.meta)) {
          if (input.key.toLowerCase() === 't' || input.key.toLowerCase() === 'k') {
            mainWindow.webContents.send('shortcut-command-palette')
            event.preventDefault()
          }
          if (input.key.toLowerCase() === 'r') {
            contents.reload()
            event.preventDefault()
          }
        }
      })
    } else {
      // If a standard BrowserWindow is created (like a popup for OAuth), close it if it fails
      contents.on('did-fail-load', (_e, errorCode) => {
        if (errorCode === -3 || errorCode === -2) {
          const win = BrowserWindow.fromWebContents(contents)
          if (win && win !== mainWindow) {
            win.close()
          }
        }
      })
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// We dynamically strip Electron and app identifiers from the default Chrome user agent
// after the app is ready to ensure flawless Google Login and 2FA.

app.commandLine.appendSwitch('disk-cache-size', '524288000') // 500MB cache

app.whenReady().then(() => {
  // Fix Google Login by stripping Electron/kairo branding natively, but keeping the exact matching Chromium version
  // This allows the native sec-ch-ua headers to pass Google's anti-bot checks perfectly!
  const defaultSession = require('electron').session.defaultSession
  const nativeUA = defaultSession.getUserAgent()
  // Clean the UA but ensure it explicitly matches a standard Chrome format
  const cleanUA = nativeUA.replace(/Electron\/[\d\.]+ /g, '').replace(/kairo\/[\d\.]+ /g, '').trim()
  
  // Global User-Agent and Client Hints Spoofing
  // This attempts to defeat Google's embedded browser detection globally,
  // so the user might actually be able to log in natively without the popup.
  defaultSession.webRequest.onBeforeSendHeaders((details: any, callback: any) => {
    details.requestHeaders['User-Agent'] = cleanUA
    // Spoof Chromium Client Hints to hide Electron
    details.requestHeaders['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"'
    details.requestHeaders['sec-ch-ua-mobile'] = '?0'
    details.requestHeaders['sec-ch-ua-platform'] = '"Windows"'
    
    callback({ cancel: false, requestHeaders: details.requestHeaders })
  })

  // THE PUPPETEER OPTION: Launch Real Chrome for Google Login
  ipcMain.handle('import-google-cookies', async () => {
    try {
      const puppeteer = require('puppeteer-core')
      const path = require('path')
      const fs = require('fs')
      const child_process = require('child_process')

      let chromePath = ''
      try {
        chromePath = child_process.execSync('which google-chrome-stable || which google-chrome || which chromium').toString().trim()
      } catch (e) {
        throw new Error('Could not find Google Chrome installed on your system.')
      }
      const persistentProfileDir = path.join(app.getPath('userData'), 'puppeteer-profile')
      if (!fs.existsSync(persistentProfileDir)) {
        fs.mkdirSync(persistentProfileDir, { recursive: true })
      }

      if (!chromePath) throw new Error('Chrome not found.')

      console.log(`Launching REAL Chrome for Login at: ${chromePath}`)

      const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        userDataDir: persistentProfileDir,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=800,900',
          '--disable-blink-features=AutomationControlled',
          '--app=https://accounts.google.com' // Launch like an app to hide URL bar
        ]
      })

      const pages = await browser.pages()
      const page = pages.length > 0 ? pages[0] : await browser.newPage()
      
      if (page.url() !== 'https://accounts.google.com/') {
        await page.goto('https://accounts.google.com')
      }

      return new Promise((resolve) => {
        let isResolved = false;
        let lastKnownCookies: any[] = [];

        // Watch for manual closure
        browser.on('disconnected', async () => {
          if (!isResolved) {
            isResolved = true;
            clearInterval(checkInterval);
            
            console.log('Browser closed. Injecting final cookies into Kairo...');
            
            // Wipe existing Google cookies in Kairo to prevent conflicts with old sessions
            try {
              const kairoCookies = await defaultSession.cookies.get({});
              for (const c of kairoCookies) {
                if (c.domain.includes('google.com') || c.domain.includes('youtube.com')) {
                   const cUrl = `http${c.secure ? 's' : ''}://${c.domain.startsWith('.') ? c.domain.substring(1) : c.domain}${c.path}`;
                   await defaultSession.cookies.remove(cUrl, c.name).catch(()=>{});
                }
              }
            } catch (e) {
              console.error('Error clearing old cookies:', e);
            }

            // Inject the final perfectly-synced multi-account cookies
            let injectedCount = 0;
            for (const cookie of lastKnownCookies) {
              const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`
              
              let sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict' = 'unspecified'
              if (cookie.sameSite === 'None') sameSite = 'no_restriction'
              else if (cookie.sameSite === 'Strict') sameSite = 'strict'
              else if (cookie.sameSite === 'Lax') sameSite = 'lax'

              try {
                const cookieDetails: any = {
                  url,
                  name: cookie.name,
                  value: cookie.value,
                  path: cookie.path,
                  secure: cookie.secure,
                  httpOnly: cookie.httpOnly,
                  sameSite,
                  expirationDate: cookie.expires > 0 ? cookie.expires : undefined
                }
                if (cookie.domain.startsWith('.')) {
                  cookieDetails.domain = cookie.domain
                }
                
                await defaultSession.cookies.set(cookieDetails)
                injectedCount++;
              } catch (e) {}
            }
            
            console.log(`Successfully injected ${injectedCount} final cookies!`)
            resolve({ success: true, count: injectedCount })
          }
        })

        const checkInterval = setInterval(async () => {
          try {
            const pages = await browser.pages()
            if (pages.length === 0) return;
            const currentPage = pages[0]
            
            const client = await currentPage.target().createCDPSession();
            const { cookies: allCookies } = await client.send('Network.getAllCookies');
            lastKnownCookies = allCookies;
          } catch (e) { }
        }, 1000)
      })
    } catch (err: any) {
      console.error('Puppeteer extraction failed:', err)
      return { success: false, error: err.message || 'Unknown error' }
    }
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.kairo.app')

  // Default open or close DevTools by F12 in development
  // We don't use optimizer.watchWindowShortcuts(window) anymore because it intercepts CommandOrControl + R globally.
  app.on('browser-window-created', (_, window) => {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        window.webContents.toggleDevTools()
        event.preventDefault()
      }
    })
  })



  ipcMain.on('clear-cache', async () => {
    const session = require('electron').session.defaultSession
    await session.clearCache()
    // Only clear memory/disk caches. Do not clear cookies or indexdb, 
    // as that would forcibly log the user out of all websites.
    await session.clearStorageData({ storages: ['caches'] })
  })

  ipcMain.on('clear-site-data', async (_, origin: string) => {
    const session = require('electron').session.defaultSession
    if (!origin) return
    try {
      await session.clearStorageData({
        origin,
        storages: ['serviceworkers', 'indexdb', 'localstorage', 'cookies', 'caches']
      })
      
      let urlObj;
      try { urlObj = new URL(origin) } catch(e) {}
      
      if (urlObj) {
        const hostname = urlObj.hostname
        const baseDomain = hostname.startsWith('www.') ? hostname.substring(4) : hostname
        
        const allCookies = await session.cookies.get({})
        for (const cookie of allCookies) {
          if (cookie.domain.includes(baseDomain)) {
            const cookieUrl = 'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain + cookie.path
            await session.cookies.remove(cookieUrl, cookie.name)
          }
        }
        
        await session.clearStorageData({
          origin: `https://${baseDomain}`,
          storages: ['serviceworkers', 'indexdb', 'localstorage', 'caches']
        })
      }
      console.log(`[Cache Clear] Successfully wiped all data for ${origin}`)
    } catch (e) {
      console.error('Failed to clear site data:', e)
    }
  })

  // --- WebContentsView Manager ---
  // IPC setup for Browser UI
  
  ipcMain.handle('get-fullscreen-state', () => {
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      return wins[0].isFullScreen() || wins[0].isSimpleFullScreen()
    }
    return false
  })
  


  ipcMain.on('context-menu-action', (_, action: string, tabId: string, params: any) => {
    const view = tabViews.get(tabId)
    if (!view) return
    const { clipboard } = require('electron')
    
    switch (action) {
      // --- LINK ACTIONS ---
      case 'open-link':
        view.webContents.loadURL(params.linkURL)
        break
      case 'open-link-new-tab':
      case 'open-link-bg-tab':
      case 'open-link-new-window':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', params.linkURL)
        break
      case 'open-link-in-space':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-space', { url: params.linkURL, spaceId: params.spaceId })
        break
      case 'copy-link':
        clipboard.writeText(params.linkURL)
        break
      case 'copy-link-text': {
        const linkText = params.linkText?.trim()
        clipboard.writeText(linkText && linkText.length > 0 ? linkText : params.linkURL)
        break
      }
      case 'bookmark-link':
        BrowserWindow.getAllWindows()[0]?.webContents.send('bookmark-url', params.linkURL)
        break
      case 'save-link':
        view.webContents.downloadURL(params.linkURL)
        break

      // --- IMAGE ACTIONS ---
      case 'open-image-new-tab':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', params.srcURL)
        break
      case 'copy-image-address':
        clipboard.writeText(params.srcURL)
        break
      case 'copy-image':
        view.webContents.copyImageAt(params.x, params.y)
        break
      case 'save-image':
        view.webContents.downloadURL(params.srcURL)
        break
      case 'search-image':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(params.srcURL)}`)
        break

      // --- VIDEO ACTIONS ---
      case 'video-play-pause':
        view.webContents.executeJavaScript(`
          (function() {
            let el = document.elementFromPoint(${params.x}, ${params.y});
            if (el && el.closest) {
              el = el.closest('video, audio');
            }
            if (el && (el.tagName === 'VIDEO' || el.tagName === 'AUDIO')) {
              if (el.paused) el.play(); else el.pause();
            }
          })();
        `)
        break
      case 'video-mute':
        view.webContents.executeJavaScript(`
          (function() {
            let el = document.elementFromPoint(${params.x}, ${params.y});
            if (el && el.closest) {
              el = el.closest('video, audio');
            }
            if (el && (el.tagName === 'VIDEO' || el.tagName === 'AUDIO')) { el.muted = !el.muted; }
          })();
        `)
        break
      case 'video-loop':
        view.webContents.executeJavaScript(`
          (function() {
            let el = document.elementFromPoint(${params.x}, ${params.y});
            if (el && el.closest) {
              el = el.closest('video');
            }
            if (el && el.tagName === 'VIDEO') { el.loop = !el.loop; }
          })();
        `)
        break
      case 'video-pip':
        view.webContents.executeJavaScript(`
          (function() {
            let el = document.elementFromPoint(${params.x}, ${params.y});
            if (el && el.closest) {
              el = el.closest('video');
            }
            if (el && el.tagName === 'VIDEO') {
              if (document.pictureInPictureElement) document.exitPictureInPicture();
              else el.requestPictureInPicture();
            }
          })();
        `)
        break
      case 'copy-video-url':
        clipboard.writeText(params.srcURL)
        break
      case 'save-video':
        view.webContents.downloadURL(params.srcURL)
        break
      case 'open-video-new-tab':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', params.srcURL)
        break

      // --- TEXT ACTIONS ---
      case 'copy-text':
        view.webContents.copy()
        break
      case 'cut-text':
        view.webContents.cut()
        break
      case 'paste-text':
        view.webContents.paste()
        break
      case 'undo':
        view.webContents.undo()
        break
      case 'redo':
        view.webContents.redo()
        break
      case 'select-all':
        view.webContents.selectAll()
        break
      case 'search-web':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', `https://google.com/search?q=${encodeURIComponent(params.selectionText)}`)
        break
      case 'ask-ai':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', `https://chatgpt.com/?q=${encodeURIComponent(params.selectionText)}`)
        break
      case 'translate-text':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', `https://translate.google.com/?text=${encodeURIComponent(params.selectionText)}`)
        break
      case 'open-text-new-tab':
        // Try to treat selection as URL if it matches, else search
        const isUrl = /^https?:\/\//i.test(params.selectionText)
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', isUrl ? params.selectionText : `https://google.com/search?q=${encodeURIComponent(params.selectionText)}`)
        break
      case 'save-to-notes':
        BrowserWindow.getAllWindows()[0]?.webContents.send('save-to-notes', params.selectionText)
        break

      // --- PAGE ACTIONS ---
      case 'back':
        if (view.webContents.canGoBack()) view.webContents.goBack()
        break
      case 'forward':
        if (view.webContents.canGoForward()) view.webContents.goForward()
        break
      case 'reload':
        view.webContents.reload()
        break
      case 'duplicate-tab':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', params.pageURL)
        break
      case 'bookmark-page':
        BrowserWindow.getAllWindows()[0]?.webContents.send('bookmark-url', params.pageURL)
        break
      case 'copy-page-url':
        clipboard.writeText(params.pageURL)
        break
      case 'save-page':
        view.webContents.downloadURL(params.pageURL)
        break
      case 'add-page-to-folder':
        BrowserWindow.getAllWindows()[0]?.webContents.send('add-tab-to-folder', { url: params.pageURL, folderId: params.folderId })
        break
      case 'view-source':
        BrowserWindow.getAllWindows()[0]?.webContents.send('open-in-new-tab', `view-source:${params.pageURL}`)
        break
      case 'dev-tools':
        if (view.webContents.isDevToolsOpened()) {
          view.webContents.closeDevTools()
        } else {
          view.webContents.openDevTools({ mode: 'right' })
        }
        break
      case 'inspect':
        view.webContents.inspectElement(params.x, params.y)
        break
    }
  })
  
  ipcMain.on('create-tab-view', (event, tabId: string, url: string) => {
    if (tabViews.has(tabId)) return;
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        v8CacheOptions: 'code',
        backgroundThrottling: true,
        enableWebSQL: false,
        spellcheck: false,
        navigateOnDragDrop: false
      }
    })
    view.webContents.userAgent = app.userAgentFallback
    view.webContents.setMaxListeners(30) // Suppress false-positive max-listeners warning from Electron internals
    
    view.webContents.on('did-navigate', (_e, navUrl) => {
      event.sender.send('tab-navigated', tabId, navUrl)
    })
    view.webContents.on('did-navigate-in-page', (_e, navUrl) => {
      event.sender.send('tab-navigated', tabId, navUrl)
    })
    view.webContents.on('page-title-updated', (_e, title) => {
      event.sender.send('tab-title-updated', tabId, title)
    })
    view.webContents.on('did-start-loading', () => {
      event.sender.send('tab-loading', tabId, true)
    })
    view.webContents.on('did-stop-loading', () => {
      event.sender.send('tab-loading', tabId, false)
    })
    view.webContents.on('page-favicon-updated', (_e, favicons) => {
      if (favicons && favicons.length > 0) {
        event.sender.send('tab-favicon-updated', tabId, favicons[0])
      }
    })
    view.webContents.on('console-message', (_event, _level, message) => {
      const msg = message || ''
      if (msg.startsWith('KAIRO_MUSIC_STATE:')) {
        event.sender.send('tab-music-state', tabId, msg.replace('KAIRO_MUSIC_STATE:', ''))
        return
      }
    })
    
    view.webContents.on('before-input-event', (e, input) => {
      if (input.type === 'keyDown') {
        if (input.key === 'F11') {
          mainWindow.setFullScreen(!mainWindow.isFullScreen())
          e.preventDefault()
        }
        if (input.control || input.meta) {
          if (input.key.toLowerCase() === 'k' || input.key.toLowerCase() === 'l') {
            event.sender.send('shortcut-command-palette')
            e.preventDefault()
          }
          if (input.key.toLowerCase() === 't') {
            event.sender.send('shortcut-new-tab')
            e.preventDefault()
          }
          if (input.key.toLowerCase() === 'r') {
            view.webContents.reload()
            e.preventDefault()
          }
        }
      }
    })

    view.webContents.on('context-menu', (contextEvent, params) => {
      contextEvent.preventDefault()
      const viewBounds = view.getBounds()
      
      event.sender.send('show-web-context-menu', {
        ...params,
        tabId,
        menuX: viewBounds.x + params.x,
        menuY: viewBounds.y + params.y
      })
    })
    
    view.webContents.on('enter-html-full-screen', () => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) win.setFullScreen(true)
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) mainWindow.webContents.send('window-fullscreen-state', true)
      }, 100)
    })

    view.webContents.on('leave-html-full-screen', () => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) win.setFullScreen(false)
      const syncAfterExit = () => {
        if (mainWindow.isDestroyed()) return
        mainWindow.webContents.send('window-fullscreen-state', false)
        requestTabBoundsSync(tabId)
        notifyWebContentsResize(view)
      }
      syncAfterExit()
      setTimeout(syncAfterExit, 150)
      setTimeout(syncAfterExit, 400)
    })
    
    // Inject Scraper and Touchpad logic natively
    view.webContents.on('dom-ready', () => {
      view.webContents.insertCSS(`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `)
      
      const currentUrl = view.webContents.getURL()
      if (currentUrl.includes('music.youtube.com') || currentUrl.includes('open.spotify.com')) {
        view.webContents.executeJavaScript(`
          if (!window.__ag_music_scraper) {
            window.__ag_music_scraper = true;
            setInterval(() => {
              let title = '';
              let artist = '';
              let isPlaying = false;
              let artUrl = '';
              let progress = 0;
              let currentTimeText = '0:00';
              let durationText = '0:00';
              
              const formatTime = (seconds) => {
                if (!seconds || isNaN(seconds)) return '0:00';
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60);
                return m + ':' + (s < 10 ? '0' : '') + s;
              };
              
              const toSeconds = (str) => {
                if (!str) return 0;
                const p = str.trim().split(':').map(Number);
                if (p.length === 2) return p[0] * 60 + p[1];
                if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
                return 0;
              };
              
              if (window.location.host.includes('youtube.com')) {
                title = document.querySelector('ytmusic-player-bar .title')?.innerText || '';
                artist = document.querySelector('ytmusic-player-bar .byline')?.innerText || '';
                const img = document.querySelector('ytmusic-player-bar img');
                artUrl = img ? img.src : '';
                
                const playBtn = document.querySelector('ytmusic-player-bar #play-pause-button');
                isPlaying = playBtn?.getAttribute('aria-label') === 'Pause' || playBtn?.getAttribute('title') === 'Pause';
                
                const timeInfo = document.querySelector('ytmusic-player-bar .time-info')?.innerText || '';
                if (timeInfo && timeInfo.includes('/')) {
                  const parts = timeInfo.split('/');
                  currentTimeText = parts[0].trim();
                  durationText = parts[1].trim();
                  const curr = toSeconds(currentTimeText);
                  const dur = toSeconds(durationText);
                  if (dur > 0) progress = (curr / dur) * 100;
                } else {
                  const video = document.querySelector('video');
                  if (video && video.duration) {
                    progress = (video.currentTime / video.duration) * 100;
                    currentTimeText = formatTime(video.currentTime);
                    durationText = formatTime(video.duration);
                  }
                }
              } else if (window.location.host.includes('spotify.com')) {
                title = document.querySelector('[data-testid="context-item-info-title"]')?.innerText || '';
                artist = document.querySelector('[data-testid="context-item-info-subtitles"]')?.innerText || '';
                const img = document.querySelector('[data-testid="cover-art-image"]');
                artUrl = img ? img.src : '';
                const btn = document.querySelector('[data-testid="control-button-playpause"]');
                isPlaying = btn ? btn.getAttribute('aria-label') === 'Pause' : false;
                
                currentTimeText = document.querySelector('[data-testid="playback-position"]')?.innerText || '0:00';
                durationText = document.querySelector('[data-testid="playback-duration"]')?.innerText || '0:00';
                const progressBar = document.querySelector('[data-testid="progress-bar"]');
                if (progressBar) {
                  const style = progressBar.getAttribute('style') || '';
                  const match = style.match(/--progress-bar-transform:\\s*([^%]+)%/);
                  if (match) {
                    progress = parseFloat(match[1]);
                  } else {
                    const val = progressBar.getAttribute('value');
                    const max = progressBar.getAttribute('max');
                    if (val && max) progress = (parseFloat(val) / parseFloat(max)) * 100;
                  }
                }
              }
              
              const stateObj = { title, artist, isPlaying, artUrl, progress, currentTimeText, durationText };
              const stateStr = JSON.stringify(stateObj);
              
              if (stateStr !== window.__ag_last_music_state || isPlaying) {
                window.__ag_last_music_state = stateStr;
                console.log('KAIRO_MUSIC_STATE:' + stateStr);
              }
            }, 1000);
            
            let accumulatedDeltaX = 0;
            let swipeTimeout = null;
            window.addEventListener('wheel', (e) => {
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY) + 2) {
                let node = e.target;
                let isScrollBlocked = false;
                while (node && node !== document.body && node !== document && node !== window) {
                  if (node.scrollWidth > node.clientWidth) {
                    if (e.deltaX < 0 && node.scrollLeft > 0) isScrollBlocked = true;
                    if (e.deltaX > 0 && node.scrollLeft + node.clientWidth < node.scrollWidth - 1) isScrollBlocked = true;
                  }
                  if (isScrollBlocked) break;
                  node = node.parentNode;
                }
                
                if (isScrollBlocked) return;
                
                const isAtLeft = window.scrollX <= 0;
                const isAtRight = window.scrollX + window.innerWidth >= document.body.scrollWidth - 1;

                if (e.deltaX < -3 && isAtLeft) {
                  accumulatedDeltaX += e.deltaX;
                  if (accumulatedDeltaX < -150) {
                    window.history.back();
                    accumulatedDeltaX = 0;
                  }
                } else if (e.deltaX > 3 && isAtRight) {
                  accumulatedDeltaX += e.deltaX;
                  if (accumulatedDeltaX > 150) {
                    window.history.forward();
                    accumulatedDeltaX = 0;
                  }
                }
              } else {
                accumulatedDeltaX = 0; 
              }
              clearTimeout(swipeTimeout);
              swipeTimeout = setTimeout(() => { accumulatedDeltaX = 0; }, 350);
            }, { passive: true });
          }
        `)
      }
    })
    
    // Pass standard Window Open Handler config for Popups
    view.webContents.setWindowOpenHandler((details) => {
      if (details.features) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            autoHideMenuBar: true,
            backgroundColor: '#09090b',
            titleBarStyle: 'hiddenInset',
          }
        }
      }
      
      if (details.disposition === 'new-window') {
        event.sender.send('open-in-split', details.url)
        return { action: 'deny' }
      }
      
      event.sender.send('open-in-new-tab', details.url)
      return { action: 'deny' }
    })
    
    view.webContents.loadURL(url)
    tabViews.set(tabId, view)
  })

  ipcMain.on('destroy-tab-view', (event, tabId: string) => {
    const view = tabViews.get(tabId)
    if (view) {
      const mainWindow = BrowserWindow.fromWebContents(event.sender)
      if (mainWindow && mainWindow.contentView.children.includes(view)) {
        mainWindow.contentView.removeChildView(view)
      }
      tabViews.delete(tabId)
      // Properly close the webContents to prevent ghost tabs running in the background and leaking listeners
      if (!view.webContents.isDestroyed()) {
        view.webContents.close()
      }
    }
  })

  ipcMain.on('tab-reload', (_event, tabId: string) => {
    const view = tabViews.get(tabId)
    if (view) {
      view.webContents.reload()
    }
  })

  ipcMain.on(
    'update-tab-bounds',
    (event, tabId: string, bounds: any, isVisible: boolean, notifyResize = false) => {
      const view = tabViews.get(tabId)
      if (view) {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
          if (isVisible && bounds.width > 0 && bounds.height > 0) {
            if (!win.contentView.children.includes(view)) {
              win.contentView.addChildView(view)
            }
            // Electron requires integer bounds
            view.setBounds({
              x: Math.round(bounds.x),
              y: Math.round(bounds.y),
              width: Math.round(bounds.width),
              height: Math.round(bounds.height)
            })
            if (notifyResize) {
              notifyWebContentsResize(view)
            }
          } else {
            if (win.contentView.children.includes(view)) {
              win.contentView.removeChildView(view)
            }
          }
        }
      }
    }
  )
  
  // Also hook into web-contents-created to ensure we cover all popups
  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'window' || contents.getType() === 'webview') {
      contents.userAgent = app.userAgentFallback
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
