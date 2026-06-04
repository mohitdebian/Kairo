import { useState, useRef } from 'react';
import { useBrowserStore } from './useBrowserStore';
import { findNodeByTabId } from './layoutUtils';

export type DragSession = {
  kind: 'tab' | 'folder' | 'workspace';
  draggedId: string;
  source: 'tabstrip';
  pointerStart: { x: number; y: number };
  current: { x: number; y: number };
  grabOffset: { x: number; y: number };
  hover: null | {
    type: 'tab' | 'folder' | 'workspace' | 'split-leaf' | 'emptySpace';
    id: string;
    side?: 'left' | 'right' | 'top' | 'bottom' | 'center';
    dropIntent?: 'reorder' | 'into-folder' | 'create-split' | 'drop-into-split';
  };
};

const DRAG_THRESHOLD = 4;

export const useTabStripDnD = () => {
  const store = useBrowserStore();
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const splitHoverTimerRef = useRef<number | null>(null);
  const capturedElementRef = useRef<HTMLElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    kind: 'tab' | 'folder' | 'workspace',
    id: string
  ) => {
    if (e.button !== 0) return;

    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    capturedElementRef.current = target;
    pointerIdRef.current = e.pointerId;

    const rect = target.getBoundingClientRect();

    setDragSession({
      kind,
      draggedId: id,
      source: 'tabstrip',
      pointerStart: { x: e.clientX, y: e.clientY },
      current: { x: e.clientX, y: e.clientY },
      grabOffset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      hover: null,
    });

    if (kind === 'tab') {
      store.setIsDraggingTab(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragSession) return;

    const dx = Math.abs(e.clientX - dragSession.pointerStart.x);
    const dy = Math.abs(e.clientY - dragSession.pointerStart.y);

    // Don't process hover targets until we've exceeded the drag threshold
    if (dx + dy < DRAG_THRESHOLD) {
      setDragSession(prev => prev ? { ...prev, current: { x: e.clientX, y: e.clientY } } : null);
      return;
    }

    // Detect elements underneath the pointer
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    let newHover: DragSession['hover'] = null;

    for (const el of elements) {
      if (!(el instanceof HTMLElement)) continue;

      const type = el.dataset.dndType as NonNullable<DragSession['hover']>['type'];
      const id = el.dataset.dndId;

      if (type && id) {
        // Skip hovering over yourself
        if (id === dragSession.draggedId && type === dragSession.kind) {
          continue;
        }

        const rect = el.getBoundingClientRect();
        let side: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'center';
        let dropIntent: 'reorder' | 'into-folder' | 'create-split' | 'drop-into-split' = 'reorder';

        if (type === 'folder') {
          const overlapY = (e.clientY - rect.top) / rect.height;
          if (dragSession.kind === 'tab' && overlapY > 0.25 && overlapY < 0.75) {
            side = 'center';
            dropIntent = 'into-folder';
          } else if (overlapY <= 0.5) {
            side = 'top';
          } else {
            side = 'bottom';
          }
        } else if (type === 'split-leaf') {
          const sideAttr = el.dataset.dndSide as NonNullable<DragSession['hover']>['side'];
          side = sideAttr || 'center';
          dropIntent = 'drop-into-split';
        } else if (type === 'tab') {
          // Simple top/bottom for reordering in sidebar
          const overlapY = (e.clientY - rect.top) / rect.height;
          side = overlapY <= 0.5 ? 'top' : 'bottom';
          dropIntent = 'reorder';
        } else {
          side = (e.clientY - rect.top) / rect.height <= 0.5 ? 'top' : 'bottom';
        }

        newHover = { type, id, side, dropIntent };
        break;
      }
    }

    setDragSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        current: { x: e.clientX, y: e.clientY },
        hover: newHover,
      };
    });
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    if (!dragSession) return;

    // Release pointer capture on the original element that captured it
    if (capturedElementRef.current && pointerIdRef.current !== null) {
      try {
        capturedElementRef.current.releasePointerCapture(pointerIdRef.current);
      } catch { /* already released */ }
    }
    capturedElementRef.current = null;
    pointerIdRef.current = null;

    if (splitHoverTimerRef.current) {
      window.clearTimeout(splitHoverTimerRef.current);
      splitHoverTimerRef.current = null;
    }

    if (dragSession.kind === 'tab') store.setIsDraggingTab(false);

    // Only commit if we actually dragged past threshold
    const dx = Math.abs(dragSession.current.x - dragSession.pointerStart.x);
    const dy = Math.abs(dragSession.current.y - dragSession.pointerStart.y);
    const didDrag = dx + dy >= DRAG_THRESHOLD;

    if (didDrag && dragSession.hover && dragSession.draggedId !== dragSession.hover.id) {
      const { type, id, side, dropIntent } = dragSession.hover;

      if (dropIntent === 'into-folder' && type === 'folder') {
        store.moveTabToFolder(dragSession.draggedId, id);
      } else if (dropIntent === 'drop-into-split' && type === 'split-leaf') {
        const direction = (side === 'top' || side === 'bottom') ? 'vertical' : 'horizontal';
        const insertBefore = (side === 'top' || side === 'left');
        if (side === 'center') {
          store.moveTabToPane(dragSession.draggedId, id);
        } else {
          store.splitPane(id, direction, dragSession.draggedId, insertBefore);
        }
      } else if (dropIntent === 'create-split' && type === 'tab') {
        const layout = store.layouts[store.activeWorkspaceId];
        if (layout) {
          const leafNode = findNodeByTabId(layout, id);
          if (leafNode) {
            const direction = (side === 'left' || side === 'right') ? 'horizontal' : 'vertical';
            const insertBefore = (side === 'top' || side === 'left');
            store.splitPane(leafNode.id, direction, dragSession.draggedId, insertBefore);
          }
        }
      } else if (dropIntent === 'reorder') {
        if (dragSession.kind === 'tab' && type === 'tab') {
          const tabs = [...store.tabs];
          const draggedIdx = tabs.findIndex(t => t.id === dragSession.draggedId);
          const targetIdx = tabs.findIndex(t => t.id === id);
          if (draggedIdx !== -1 && targetIdx !== -1) {
            const draggedTab = tabs[draggedIdx];
            const targetTab = tabs[targetIdx];

            if (draggedTab.folderId !== targetTab.folderId) {
              store.moveTabToFolder(dragSession.draggedId, targetTab.folderId, id);
            } else {
              const [removed] = tabs.splice(draggedIdx, 1);
              const newTargetIdx = tabs.findIndex(t => t.id === id);
              const insertIdx = side === 'bottom' ? newTargetIdx + 1 : newTargetIdx;
              tabs.splice(insertIdx, 0, removed);
              store.reorderTabs(tabs);
            }
          }
        } else if (dragSession.kind === 'tab' && type === 'workspace') {
          store.moveTabToWorkspace(dragSession.draggedId, id);
        } else if (dragSession.kind === 'tab' && type === 'folder') {
          store.moveTabToFolder(dragSession.draggedId, id);
        } else if (dragSession.kind === 'folder' && type === 'folder') {
          const folders = [...store.folders];
          const draggedIdx = folders.findIndex(f => f.id === dragSession.draggedId);
          const targetIdx = folders.findIndex(f => f.id === id);
          if (draggedIdx !== -1 && targetIdx !== -1) {
            const [removed] = folders.splice(draggedIdx, 1);
            const newTargetIdx = folders.findIndex(f => f.id === id);
            const insertIdx = side === 'bottom' ? newTargetIdx + 1 : newTargetIdx;
            folders.splice(insertIdx, 0, removed);
            store.reorderFolders(folders);
          }
        } else if (dragSession.kind === 'workspace' && type === 'workspace') {
          const workspaces = [...store.workspaces];
          const draggedIdx = workspaces.findIndex(w => w.id === dragSession.draggedId);
          const targetIdx = workspaces.findIndex(w => w.id === id);
          if (draggedIdx !== -1 && targetIdx !== -1) {
            const [removed] = workspaces.splice(draggedIdx, 1);
            const newTargetIdx = workspaces.findIndex(w => w.id === id);
            const insertIdx = side === 'bottom' ? newTargetIdx + 1 : newTargetIdx;
            workspaces.splice(insertIdx, 0, removed);
            store.reorderWorkspaces(workspaces);
          }
        }
      }
    }

    setDragSession(null);
  };

  return {
    dragSession,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
};
