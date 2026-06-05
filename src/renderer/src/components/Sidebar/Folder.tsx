import { Folder as FolderIcon, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useBrowserStore } from '../../store/useBrowserStore'
import { useShallow } from 'zustand/react/shallow'

export const Folder = ({
  folder,
  onToggle,
  onContextMenu,
  editingFolderId,
  editFolderName,
  setEditFolderName,
  onSubmitRename,
  onCancelRename,
  onPointerDown,
  isDragOver,
  renderTab
}: any) => {
  const tabIds = useBrowserStore(useShallow(state => 
    state.tabs.filter(t => t.folderId === folder.id && !t.pinned).map(t => t.id)
  ))
  return (
    <div
      className="flex flex-col gap-0.5 mb-1"
      onContextMenu={(e) => onContextMenu(e, 'folder', folder.id)}
      data-dnd-type="folder"
      data-dnd-id={folder.id}
    >
      <div
        onPointerDown={(e) => onPointerDown(e, 'folder', folder.id)}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-text-secondary transition-colors cursor-pointer group',
          isDragOver
            ? 'bg-[var(--color-accent)]/20 text-text-primary ring-1 ring-[var(--color-accent)]'
            : 'hover:bg-white/5 hover:text-text-primary'
        )}
        data-dragover={isDragOver}
      >
        <div className="p-0.5 flex items-center justify-center">
          <FolderIcon
            size={14}
            className="group-hover:text-[var(--color-accent)] transition-colors"
          />
        </div>
        {editingFolderId === folder.id ? (
          <input
            autoFocus
            value={editFolderName}
            onChange={(e) => setEditFolderName(e.target.value)}
            onBlur={onSubmitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmitRename()
              if (e.key === 'Escape') onCancelRename()
              e.stopPropagation()
            }}
            className="bg-transparent outline-none flex-1 text-[12px] font-semibold tracking-wide text-white min-w-0"
          />
        ) : (
          <span className="text-[12px] font-semibold tracking-wide flex-1 truncate select-none">
            {folder.name}
          </span>
        )}
        {folder.isExpanded ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
      </div>
      {folder.isExpanded && tabIds.length > 0 && (
        <div className="pl-3 pr-1 border-l border-white/[0.05] ml-3.5 flex flex-col gap-0.5 mt-1">
          {tabIds.map(renderTab)}
        </div>
      )}
    </div>
  )
}
