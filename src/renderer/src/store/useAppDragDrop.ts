import { useState } from 'react'
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useBrowserStore } from './useBrowserStore'

export const useAppDragDrop = () => {
  const store = useBrowserStore()
  const { tabs, folders, workspaces } = store

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [activeDragItem, setActiveDragItem] = useState<{
    id: string
    type: string
    data: any
  } | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveDragItem({
      id: active.id as string,
      type: active.data.current?.type as string,
      data: active.data.current
    })
    if (active.data.current?.type === 'tab') {
      store.setIsDraggingTab(true)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    if (active.data.current?.type === 'tab') {
      // Logic moved to handleDragEnd to prevent layout shifts during dragging
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null)
    store.setIsDraggingTab(false)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Splitting a pane!
    if (active.data.current?.type === 'tab' && over.data.current?.type === 'split-leaf') {
      const { nodeId, side } = over.data.current

      if (side === 'center') {
        store.moveTabToPane(activeId, nodeId)
      } else {
        const direction = side === 'top' || side === 'bottom' ? 'vertical' : 'horizontal'
        const insertBefore = side === 'top' || side === 'left'
        store.splitPane(nodeId, direction, activeId, insertBefore)
      }
      return
    }

    // Reordering Workspaces
    if (active.data.current?.type === 'workspace' && over.data.current?.type === 'workspace') {
      const oldIndex = workspaces.findIndex((w) => w.id === activeId)
      const newIndex = workspaces.findIndex((w) => w.id === overId)
      store.reorderWorkspaces(arrayMove(workspaces, oldIndex, newIndex))
      return
    }

    // Dropping a Tab onto a Workspace Dot -> Move tab to workspace
    if (active.data.current?.type === 'tab' && over.data.current?.type === 'workspace') {
      store.moveTabToWorkspace(activeId, overId)
      return
    }

    // Dropping a Tab onto a Folder -> Move tab to folder
    if (active.data.current?.type === 'tab' && over.data.current?.type === 'folder') {
      const draggedTab = tabs.find((t) => t.id === activeId)
      if (draggedTab && draggedTab.folderId !== overId) {
        store.moveTabToFolder(activeId, overId)
      }
      return
    }

    // Dropping a Tab onto Root Area -> Move out of folder
    if (active.data.current?.type === 'tab' && over.data.current?.type === 'root-area') {
      const draggedTab = tabs.find((t) => t.id === activeId)
      if (draggedTab && draggedTab.folderId !== undefined) {
        store.moveTabToFolder(activeId, undefined)
      }
      return
    }

    // Dropping a Tab onto another Tab (different folder context) -> Move to that folder
    if (active.data.current?.type === 'tab' && over.data.current?.type === 'tab') {
      const draggedTab = tabs.find((t) => t.id === activeId)
      const targetTab = tabs.find((t) => t.id === overId)

      if (draggedTab && targetTab) {
        if (draggedTab.folderId !== targetTab.folderId) {
          store.moveTabToFolder(activeId, targetTab.folderId, targetTab.id)
        } else {
          // Reordering Tabs in same folder
          const oldIndex = tabs.findIndex((t) => t.id === activeId)
          const newIndex = tabs.findIndex((t) => t.id === overId)
          store.reorderTabs(arrayMove(tabs, oldIndex, newIndex))
        }
      }
      return
    }

    // Reordering Folders
    if (active.data.current?.type === 'folder' && over.data.current?.type === 'folder') {
      const oldIndex = folders.findIndex((f) => f.id === activeId)
      const newIndex = folders.findIndex((f) => f.id === overId)
      store.reorderFolders(arrayMove(folders, oldIndex, newIndex))
      return
    }
  }

  return { sensors, activeDragItem, handleDragStart, handleDragOver, handleDragEnd }
}
