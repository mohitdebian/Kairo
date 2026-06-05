---
title: '🐛 Right-click context menu missing standard options on homepage'
labels: bug, good first issue, UI/UX, context-menu
assignees: ''
---

## 🐛 Bug Report

### Description

Right-clicking inside the browser's homepage (and on webpages) does not show the expected context menu options that users rely on in every modern browser. Standard actions like **"Open Link in New Tab"**, **"Copy Link Address"**, **"Inspect Element"**, etc. are either missing or not appearing at all.

This makes Kairo feel broken compared to Chrome, Firefox, Arc, Edge, and Zen Browser — where right-clicking is a core navigation workflow.

---

### Expected Behavior

Right-clicking should display a native-style context menu with relevant options depending on **what** was clicked:

| Clicked On             | Expected Options                                                                |
| ---------------------- | ------------------------------------------------------------------------------- |
| 🔗 **Link**            | Open Link in New Tab, Open Link in New Space, Copy Link Address, Copy Link Text |
| 🖼️ **Image**           | Open Image in New Tab, Save Image As, Copy Image, Copy Image Address            |
| ✏️ **Selected Text**   | Copy, Search with Google, Look Up Selection                                     |
| ▶️ **Video / Audio**   | Play/Pause, Mute, Open in New Tab, Picture-in-Picture                           |
| 📄 **Empty Page Area** | Back, Forward, Reload, View Page Source, Inspect Element                        |
| 📋 **Input Field**     | Undo, Redo, Cut, Copy, Paste, Select All                                        |

All context menus should also include a universal **"Inspect Element"** option at the bottom (opens DevTools focused on the clicked element).

---

### Current Behavior

- Right-clicking on links, images, selected text, videos, and empty areas produces **no context menu** or a **broken/incomplete one**.
- "Open Link in New Tab" does not appear or does not function.
- "Inspect Element" is missing entirely.
- The context menu may appear at the **wrong position** (e.g., top-left of the window instead of at the cursor).

---

### Steps to Reproduce

1. Launch Kairo (`npm run dev`).
2. Navigate to any webpage (e.g., `https://github.com`).
3. Right-click on a **link** → Observe: no "Open Link in New Tab" option.
4. Right-click on an **image** → Observe: no image-related options.
5. Right-click on **empty space** → Observe: no "Inspect Element" option.
6. Select some **text** and right-click → Observe: no "Copy" / "Search" option.

---

### Root Cause (Investigation Hints)

This is a great issue for first-time contributors! Here's where to start looking:

1. **Check for `preventDefault()`** — Search the codebase for any code that may be globally blocking the `contextmenu` event:

   ```bash
   grep -rn "contextmenu\|onContextMenu\|preventDefault" src/
   ```

2. **Electron `context-menu` event** — Kairo uses `WebContentsView` for tabs. The main process needs to listen for the `context-menu` event on each tab's `webContents`:

   ```js
   // src/main/ — look for this pattern
   webContents.on('context-menu', (event, params) => { ... })
   ```

3. **`params` object** — Electron provides a rich `params` object in the `context-menu` event that tells you exactly what was right-clicked (link URL, image URL, selected text, media type, etc.). The context menu should be built **dynamically** based on these params.

4. **Menu positioning** — Ensure the menu appears at `params.x`, `params.y` (the cursor position), not at `(0, 0)`.

---

### Relevant Files

| File                | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `src/main/index.ts` | Main process — where `context-menu` listeners should be attached               |
| `src/renderer/`     | Renderer process — check for any `onContextMenu` or `preventDefault` overrides |

---

### Acceptance Criteria

- [ ] Right-clicking a **link** shows: "Open Link in New Tab", "Copy Link Address", "Copy Link Text"
- [ ] Right-clicking an **image** shows: "Open Image in New Tab", "Save Image As", "Copy Image Address"
- [ ] Right-clicking **selected text** shows: "Copy", "Search with Google"
- [ ] Right-clicking an **input field** shows: "Cut", "Copy", "Paste", "Select All"
- [ ] Right-clicking **empty space** shows: "Back", "Forward", "Reload", "View Page Source"
- [ ] **"Inspect Element"** appears on every context menu and opens DevTools focused on the element
- [ ] Context menu appears **at the cursor position**, not at the corner of the window
- [ ] All actions actually **work** when clicked (not just cosmetic labels)

---

### Additional Context

- **Electron Docs**: [webContents `context-menu` event](https://www.electronjs.org/docs/latest/api/web-contents#event-context-menu)
- **Electron Docs**: [Menu.buildFromTemplate](https://www.electronjs.org/docs/latest/api/menu#menubuildfromtemplatetemplate)
- **Reference**: See how [Electron Fiddle](https://github.com/nicknisi/electron-fiddle) or [Min Browser](https://github.com/nicknisi/min) handle context menus.

---

> **💡 Tip for contributors:** This issue touches both the **Main Process** (Electron backend) and how tabs are created. A good approach is to start by adding a simple `console.log` inside a `context-menu` listener to confirm events are firing, then incrementally build out the full menu.
