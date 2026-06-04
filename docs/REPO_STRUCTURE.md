# Repository Structure

Kairo uses a monorepo-style structure adapted for Electron apps via `electron-vite`.

```
Kairo/
├── src/
│   ├── main/             # Electron Main Process (Backend)
│   │   ├── index.ts      # Entry point, Window management, IPC routing
│   │   └── ...
│   │
│   ├── preload/          # Electron Preload Scripts (Bridge)
│   │   ├── index.ts      # Exposes window.electron.ipcRenderer to React
│   │   └── ...
│   │
│   └── renderer/         # React Frontend (App UI)
│       ├── index.html    # Entry HTML
│       └── src/
│           ├── components/ # React UI Components
│           │   ├── Sidebar/    # Tab strips, folders, spaces
│           │   ├── TopBar/     # URL omnibox, navigation controls
│           │   ├── Layout/     # AppLayout, SplitView logic
│           │   ├── ContextMenu/# Custom right-click DOM overlays
│           │   └── Settings/   # User configuration modals
│           │
│           ├── store/      # Zustand State Management
│           │   ├── useBrowserStore.ts  # Core tab & space state
│           │   └── TabStripDnDController.ts # Drag-and-drop logic
│           │
│           ├── assets/     # Global CSS, Tailwind config, Icons
│           └── App.tsx     # Root component
│
├── docs/                 # Community & Architecture Documentation
├── resources/            # App icons for packaging (macOS, Win, Linux)
├── build/                # Output directory for packaged binaries
├── out/                  # Output directory for compiled TS (electron-vite)
│
├── electron.vite.config.ts # Build configuration
├── package.json          # Dependencies & Scripts
└── tailwind.config.js    # UI Styling tokens
```

## Where to find things:
- **I want to fix a bug in the context menu:** Look in `src/renderer/src/components/ContextMenu/`.
- **I want to change how the URL bar looks:** Look in `src/renderer/src/components/TopBar/`.
- **I want to fix a bug where a new tab doesn't load:** Look in `src/main/index.ts` (creation) and `src/renderer/src/store/useBrowserStore.ts` (state).
- **I want to add a new IPC command:** 
  1. Add it to `src/preload/index.d.ts` (types)
  2. Emit it from `src/renderer/`
  3. Listen for it in `src/main/index.ts`
