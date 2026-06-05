# Kairo Browser Architecture

This document serves as an overview of Kairo's internal architecture to help contributors understand how the browser operates.

## Overview

Kairo is built using **Electron**, **React**, and **TypeScript**.
Unlike standard web apps, a browser has to juggle a highly privileged backend (Main Process) with a sandboxed frontend (Renderer Process) while rendering _untrusted_ third-party websites in a secure, isolated manner.

### The Three Layers

1. **The Main Process (`src/main`)**: The "Backend" of Kairo. It has full OS access. It handles window creation, global shortcuts, IPC routing, and manages the lifecycle of actual browser tabs (using `WebContentsView`).
2. **The App UI Renderer (`src/renderer`)**: The "Frontend" of Kairo. This is a React application that draws the sidebar, the address bar, the settings modal, and the tab strips. It **does not** render the actual websites.
3. **The WebViews (`WebContentsView`)**: The actual web pages you browse. These are natively composited over the React UI by Electron. They are sandboxed and isolated from Kairo's internal APIs.

## Key Systems

### 1. Tab System

We do NOT use `<webview>` tags. They are deprecated, slow, and buggy.
Instead, we use Electron's new **`WebContentsView`** API.

- When the React UI requests a new tab, it sends an IPC event `create-tab-view` to the Main Process.
- The Main Process creates a native `WebContentsView` and attaches it to the browser window.
- The React UI listens to window resizes and sends `update-tab-bounds` to the Main Process, telling it exactly where to draw the native view (e.g., leaving space for the sidebar and top bar).

### 2. Spaces & Folders

State is managed globally in React using **Zustand** (`src/renderer/src/store/useBrowserStore.ts`).

- Tabs belong to specific **Spaces** (Workspaces).
- Tabs can also be nested inside **Folders**.
- When you switch a Space, the Zustand store updates the active workspace ID. The `AppLayout` component then tells the Main Process which `WebContentsView` should be visible and which should be hidden.

### 3. Sleeping Tabs

To keep Kairo blazing fast and low on memory:

- A background worker monitors tab activity.
- If a tab hasn't been focused in X minutes (configurable), Kairo destroys the `WebContentsView` to free up RAM, but keeps the tab's metadata in the Zustand store.
- When the user clicks the sleeping tab, the `WebContentsView` is re-instantiated and loaded from the cache.

### 4. Split View

Split view is achieved by mounting multiple `WebContentsView` instances side-by-side.

- The React frontend calculates the layout splits (50/50, 70/30) and sends the exact pixel bounds via `update-tab-bounds` to the Main Process.

### 5. AI Tab Groups

_(Coming Soon)_
AI processing is intended to run locally using lightweight ONNX models via a background worker thread. When the user requests a tab cleanup, Kairo extracts the text content of active tabs, feeds it to the local LLM, and groups them via semantic similarity.

## Security Model

- **Context Isolation is ON**: The React UI and the Preload scripts are isolated.
- **Node Integration is OFF**: The React UI cannot access `fs` or `child_process`. It must ask the Main Process via IPC.
- **Sandboxing**: All web content loaded into a tab runs in a strictly sandboxed Chromium process.
