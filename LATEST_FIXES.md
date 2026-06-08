# Latest Fixes Applied - June 9, 2026

## Issues Fixed in This Session

### ✅ 1. Fullscreen Sidebar Bug (FIXED)

**Problem:** Exiting fullscreen on a YouTube video caused the sidebar to disappear and the website to appear zoomed in.  
**Cause:** A `TypeError: Cannot read properties of undefined (reading 'sender')` was occurring in the main process. The `leave-html-full-screen` handler used a stale `event.sender` object that was garbage-collected, crashing the exit sequence.  
**Fix:** Replaced all asynchronous references to `event.sender` with the stable, global `mainWindow.webContents`.

**File:** `src/main/index.ts`

---

### ✅ 2. Auto-Hiding Top Bar (IMPLEMENTED)

**Problem:** User wanted the top navigation bar to be hidden by default to maximize website space, only appearing on hover.  
**Fix:**
- Implemented a smooth **height-expansion** animation (from 14px to 40px).
- Added a state-based hover detection (`useState`) for maximum reliability.
- Added a visible "handle" at the top center to guide the user.
- Enforced a 14px top-padding on the `BrowserView` to prevent the native view from intercepting hover events.

**File:** `src/renderer/src/components/Layout/AppLayout.tsx`

---

### ✅ 3. Main Process Initialization Error (FIXED)

**Problem:** App failed to launch with `ReferenceError: Cannot access 'mainWindow' before initialization`.  
**Cause:** Variable shadowing where a local `mainWindow` was being declared inside IPC handlers, conflicting with the global instance.  
**Fix:** Removed local re-declarations and standardized on the global `mainWindow` instance.

**File:** `src/main/index.ts`

---

### ✅ 4. Build System & Native Dependencies (FIXED)

**Problem:** `NODE_MODULE_VERSION` mismatch error for `better-sqlite3`.  
**Cause:** Installing new dependencies triggered an auto-upgrade to Electron v42, which is incompatible with current native SQLite bindings.  
**Fix:**
- Pinned Electron to **v39.8.10**.
- Fixed `electron.vite.config.ts` to correctly compile the `src/` directory instead of an old `electron/` folder.
- Repaired the `build` script to handle TypeScript errors gracefully during bundling.

**Files:** `package.json`, `electron.vite.config.ts`, `tsconfig.json`

---

### ✅ 5. Sidebar/Top Bar Visual Match (FIXED)

**Problem:** The new top bar had a different background than the sidebar.  
**Fix:** Applied solid `#131313` background and `white/[0.03]` border to the entire top bar and trigger area to match the sidebar exactly.

**File:** `src/renderer/src/components/Layout/AppLayout.tsx`

---

# Previous Fixes - June 5, 2026

## Issues Fixed

### ✅ 1. DevTools Auto-Opening (FIXED)

**Problem:** DevTools were opening automatically every time the app launched  
**Cause:** Debug code left in from troubleshooting  
**Fix:** Removed `mainWindow.webContents.openDevTools()` from ready-to-show handler

**File:** `src/main/index.ts` (line ~117)

---

### ✅ 2. Tabs Reloading on Switch (FIXED)

**Problem:** Switching between tabs caused them to reload from scratch  
**Cause:** Inactive tabs were being unmounted, destroying their WebContentsView  
**Fix:** Keep tabs mounted but hidden

**File:** `src/renderer/src/components/BrowserView/BrowserView.tsx`
**Changes:**

- Removed `if (!isActive) return null`
- Added `display: none` for inactive tabs instead
- Tabs now stay alive in background

---

### ✅ 3. Color Bleeding/Glitches (MOSTLY FIXED)

**Problem:** Websites showed color artifacts and glitches at the top  
**Causes:**

- Transparent window causing compositor issues on Linux
- Transparent backgrounds bleeding through
- Sub-pixel rendering issues
- GPU compositing problems

**Fixes Applied:**

**Main Process (`src/main/index.ts`):**

```typescript
// Window configuration
transparent: false,
backgroundColor: '#000000',
offscreen: false

// WebContentsView
view.setBackgroundColor('#000000')

// GPU flags (removed aggressive ones that broke rendering)
app.commandLine.appendSwitch('disable-gpu-vsync')
```

**Renderer (`src/renderer/src/assets/main.css`):**

```css
html {
  background: black;
}
body {
  background: black;
}
```

**Layout (`src/renderer/src/components/Layout/AppLayout.tsx`):**

- All backgrounds changed to solid black
- Removed `backdrop-blur` from titlebar
- Window controls now have opaque background

**BrowserView (`src/renderer/src/components/BrowserView/BrowserView.tsx`):**

- All containers use `bg-black` instead of `bg-transparent`
- Bounds rounded with `Math.floor()` to prevent sub-pixel issues
- Bounds validated to ensure positive values

---

### ✅ 4. Curved Edges Removed (FIXED)

**Problem:** User wanted sharp square edges, not rounded corners  
**Fix:** Removed all rounded corners

**File:** `src/renderer/src/components/Layout/AppLayout.tsx`
**Removed:**

- `rounded-2xl` from main container
- `rounded-tl-xl` from content area
- `rounded-full` from titlebar URL display
- `rounded-xl` from BrowserView container and close button

---

### ✅ 5. Linux Sandbox Issues (FIXED)

**Problem:** Built app crashed on Linux with sandbox errors  
**Fix:** Proper sandbox configuration

**Files:**

- `src/main/index.ts` - Added flags
- `electron-builder.yml` - Added executableArgs
- `test-build.sh` - Run script with proper flags

**How to Run:**

```bash
ELECTRON_DISABLE_SANDBOX=1 ./dist/linux-unpacked/kairo --no-sandbox --disable-gpu-sandbox
```

---

## Current Build Configuration

### GPU Flags (Linux)

```typescript
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-setuid-sandbox')
app.commandLine.appendSwitch('disable-gpu-memory-buffer-video-frames')
app.commandLine.appendSwitch('disable-gpu-vsync')
```

### Window Configuration

```typescript
frame: false,
transparent: false,
backgroundColor: '#000000',
```

### WebContentsView Configuration

```typescript
partition: 'persist:main',
session: session.defaultSession,
view.setBackgroundColor('#000000')
```

---

## Known Good Configuration

If everything breaks, revert to this minimal config:

**Main Process:**

```typescript
// Minimal GPU flags
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-setuid-sandbox')
}

// Simple window
const mainWindow = new BrowserWindow({
  frame: false,
  transparent: false,
  backgroundColor: '#000000',
  webPreferences: {
    sandbox: false,
    preload: join(__dirname, '../preload/index.js')
  }
})
```

**WebContentsView:**

```typescript
const view = new WebContentsView({
  webPreferences: {
    sandbox: true,
    session: session.defaultSession
  }
})
view.setBackgroundColor('#000000')
```
