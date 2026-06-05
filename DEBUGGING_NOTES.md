# Debugging Notes for Kairo Browser

## Recent Fixes Applied

### ✅ Fix 1: Linux Sandbox Crash

**Problem:** Built app crashed with `FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc` error  
**Solution:**

- Added `disable-setuid-sandbox` flag
- Use `ELECTRON_DISABLE_SANDBOX=1` environment variable
- Run with `--no-sandbox --disable-gpu-sandbox` flags

### ✅ Fix 2: Tabs Reload on Switch

**Problem:** Switching between tabs caused them to reload from scratch  
**Root Cause:** Inactive tabs were being unmounted, destroying their WebContentsView  
**Solution:** Changed rendering to hide inactive tabs instead of unmounting them

- Used `display: none` for inactive tabs
- Keeps WebContentsView alive in background
- Preserves page state, scroll position, and form data

### ✅ Fix 3: Visual Glitches/Color Problems

**Problem:** Websites had color glitches or rendering artifacts at the top  
**Root Cause:** Transparent window + transparent body causing GPU compositing issues on Linux  
**Solution:**

- Changed `transparent: false` in BrowserWindow
- Changed `backgroundColor: '#0F0F11'` (from transparent)
- Changed body `bg-[var(--color-bg-primary)]` (from bg-transparent)
- Added GPU rendering fixes for Linux
- Changed WebContentsView container from `bg-transparent` to `bg-black`

### ✅ Fix 4: WebContentsView Session

**Problem:** Tab views might not have proper network access in production  
**Solution:**

- Explicitly set `session: session.defaultSession`
- Added `partition: 'persist:main'` for persistent session

# Debugging Notes for Kairo Browser

## Running the Built App

### Method 1: Direct Execution (Recommended for Testing)

```bash
cd /home/mohit/projects/browser
ELECTRON_DISABLE_SANDBOX=1 ./dist/linux-unpacked/kairo --no-sandbox --disable-gpu-sandbox
```

### Method 2: Use the Test Script

```bash
cd /home/mohit/projects/browser
chmod +x test-build.sh
./test-build.sh
```

### Method 3: Install and Run the Package

```bash
# For .deb package
sudo dpkg -i ./dist/kairo_1.0.0_amd64.deb
kairo --no-sandbox

# For AppImage
chmod +x ./dist/kairo-1.0.0.AppImage
ELECTRON_DISABLE_SANDBOX=1 ./dist/kairo-1.0.0.AppImage --no-sandbox
```

## Linux Sandbox Issue

The app requires `--no-sandbox` flag on Linux because:

1. The chrome-sandbox binary needs root ownership and special permissions (4755)
2. Running with `ELECTRON_DISABLE_SANDBOX=1` environment variable bypasses this requirement

## Fixes Applied

### 1. Sandbox Configuration

- Added `disable-setuid-sandbox` to app command line switches
- Added `--no-sandbox` to electron-builder Linux executable args
- Use `ELECTRON_DISABLE_SANDBOX=1` environment variable when running

### 2. WebContentsView Session Fix

- Explicitly set `session: session.defaultSession` for tab views
- Added `partition: 'persist:main'` for persistent session
- This ensures tabs can make network requests properly

### 3. DevTools in Production (TEMPORARY)

Currently enabled for debugging. To disable:

**File:** `src/main/index.ts`
**Line:** Around line 115

Change:

```typescript
mainWindow.on('ready-to-show', () => {
  mainWindow.show()
  mainWindow.webContents.openDevTools() // <- REMOVE THIS LINE
})
```

To:

```typescript
mainWindow.on('ready-to-show', () => {
  mainWindow.show()
})
```

Then rebuild:

```bash
npm run build:linux
```

## Common Issues

### Pages Not Loading

- Check DevTools console for network errors
- Verify the session configuration in WebContentsView creation
- Check if ad blocker is blocking the domain

### App Crashes on Startup

- Use `--no-sandbox` flag
- Set `ELECTRON_DISABLE_SANDBOX=1` environment variable
- Check file permissions in dist folder

### Google Login Issues

- The app uses Puppeteer to handle Google login
- Native Chrome is required: `google-chrome-stable` or `chromium`
- Install with: `sudo apt install google-chrome-stable`

## Build Commands

```bash
# Development
npm run dev

# Build for Linux (all formats)
npm run build:linux

# Build unpacked only (faster for testing)
npm run build:unpack

# Type checking
npm run typecheck
```

## Logs Location

- Dev mode: Console output
- Production: Run from terminal to see logs
- Profile data: `.native-profile/` directory
