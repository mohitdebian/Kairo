import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Link,
  Copy,
  Image as ImageIcon,
  Download,
  Play,
  VolumeX,
  Repeat,
  Maximize,
  Scissors,
  ClipboardPaste,
  Search,
  PanelRight,
  Bookmark,
  FolderPlus,
  MonitorUp,
  Languages,
  Sparkles,
  Plus,
  RefreshCw,
  FileCode,
  Terminal,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'

interface ContextMenuParams {
  x: number
  y: number
  linkURL: string
  linkText: string
  pageURL: string
  frameURL: string
  srcURL: string
  mediaType: string
  hasImageContents: boolean
  isEditable: boolean
  selectionText: string
  titleText: string
  misspelledWord: string
  dictionarySuggestions: string[]
  frameCharset: string
  tabId: string
}

export const WebContextMenu = () => {
  const [params, setParams] = useState<(ContextMenuParams & { x: number; y: number }) | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const storeState = useBrowserStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleShowContextMenu = (_event: any, p: ContextMenuParams & { x: number; y: number }) => {
      setParams(p)
      setIsVisible(true)
    }

    window.electron.ipcRenderer.on('show-web-context-menu', handleShowContextMenu)

    // Auto hide when blur happens or clicked outside
    const handleGlobalClick = () => setIsVisible(false)
    window.addEventListener('blur', handleGlobalClick)
    window.addEventListener('click', handleGlobalClick)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('show-web-context-menu')
      window.removeEventListener('blur', handleGlobalClick)
      window.removeEventListener('click', handleGlobalClick)
    }
  }, [])

  useEffect(() => {
    // When visible changes to false, send hide command just in case
    if (!isVisible) {
      setTimeout(() => setParams(null), 150)
    }
  }, [isVisible])

  const executeAction = (action: string) => {
    if (!params) return
    window.electron.ipcRenderer.send('context-menu-action', action, params.tabId, params)
    setIsVisible(false)
  }

  if (!params) return null

  const renderItems = () => {
    const items: React.ReactNode[] = []

    // -------------------------
    // LINK OPTIONS
    // -------------------------
    if (params.linkURL) {
      items.push(
        <MenuItem
          key="link-tab"
          icon={<ExternalLink size={14} />}
          label="Open Link in New Tab"
          onClick={() => executeAction('open-link-new-tab')}
        />,
        <MenuItem
          key="link-space"
          icon={<FolderPlus size={14} />}
          label="Open Link in New Space"
          onClick={() => executeAction('open-link-new-space')}
        />,
        <MenuSeparator key="sep-link-1" />
      )

      items.push(
        <MenuItem
          key="copy-link-address"
          icon={<Link size={14} />}
          label="Copy Link Address"
          onClick={() => executeAction('copy-link')}
        />,
        <MenuItem
          key="copy-link-text"
          icon={<Copy size={14} />}
          label="Copy Link Text"
          onClick={() => executeAction('copy-link-text')}
        />,
        <MenuSeparator key="sep-link-2" />
      )
    }

    // -------------------------
    // IMAGE OPTIONS
    // -------------------------
    if (params.mediaType === 'image' || params.hasImageContents) {
      items.push(
        <MenuItem
          key="img-tab"
          icon={<ImageIcon size={14} />}
          label="Open Image in New Tab"
          onClick={() => executeAction('open-image-new-tab')}
        />,
        <MenuItem
          key="save-img"
          icon={<Download size={14} />}
          label="Save Image As"
          onClick={() => executeAction('save-image')}
        />,
        <MenuItem
          key="copy-img-addr"
          icon={<Link size={14} />}
          label="Copy Image Address"
          onClick={() => executeAction('copy-image-address')}
        />,
        <MenuSeparator key="sep-img-1" />
      )
    }

    // -------------------------
    // VIDEO OPTIONS
    // -------------------------
    if (params.mediaType === 'video' || params.mediaType === 'audio') {
      items.push(
        <MenuItem
          key="vid-play"
          icon={<Play size={14} />}
          label="Play / Pause"
          onClick={() => executeAction('video-play-pause')}
        />,
        <MenuItem
          key="vid-mute"
          icon={<VolumeX size={14} />}
          label="Mute"
          onClick={() => executeAction('video-mute')}
        />,
        <MenuItem
          key="vid-new-tab"
          icon={<ExternalLink size={14} />}
          label="Open in New Tab"
          onClick={() => executeAction('open-video-new-tab')}
        />,
        <MenuItem
          key="vid-pip"
          icon={<Maximize size={14} />}
          label="Picture-in-Picture"
          onClick={() => executeAction('video-pip')}
        />,
        <MenuSeparator key="sep-vid-1" />
      )
    }

    // -------------------------
    // SELECTION TEXT OPTIONS
    // -------------------------
    if (params.selectionText && !params.isEditable) {
      items.push(
        <MenuItem
          key="copy-text"
          icon={<Copy size={14} />}
          label="Copy"
          onClick={() => executeAction('copy-text')}
        />,
        <MenuSeparator key="sep-text-1" />,
        <MenuItem
          key="search-web"
          icon={<Search size={14} />}
          label="Search with Google"
          onClick={() => executeAction('search-web')}
        />,
        <MenuSeparator key="sep-text-2" />
      )
    }

    // -------------------------
    // INPUT FIELD OPTIONS
    // -------------------------
    if (params.isEditable) {
      items.push(
        <MenuItem key="undo" label="Undo" onClick={() => executeAction('undo')} />,
        <MenuItem key="redo" label="Redo" onClick={() => executeAction('redo')} />,
        <MenuSeparator key="sep-edit-1" />,
        <MenuItem
          key="cut-text"
          icon={<Scissors size={14} />}
          label="Cut"
          onClick={() => executeAction('cut-text')}
        />,
        <MenuItem
          key="copy-text"
          icon={<Copy size={14} />}
          label="Copy"
          onClick={() => executeAction('copy-text')}
        />,
        <MenuItem
          key="paste-text"
          icon={<ClipboardPaste size={14} />}
          label="Paste"
          onClick={() => executeAction('paste-text')}
        />,
        <MenuSeparator key="sep-edit-2" />,
        <MenuItem
          key="select-all"
          label="Select All"
          onClick={() => executeAction('select-all')}
        />,
        <MenuSeparator key="sep-edit-3" />
      )
    }

    // Remove trailing separators from specific media types before adding page defaults
    if (items.length > 0 && (items[items.length - 1] as any).type === MenuSeparator) {
      items.pop()
    }

    // -------------------------
    // PAGE DEFAULTS (When clicking empty space or as fallback)
    // -------------------------
    if (items.length === 0) {
      items.push(
        <MenuItem
          key="back"
          icon={<ArrowLeft size={14} />}
          label="Back"
          onClick={() => executeAction('back')}
        />,
        <MenuItem
          key="forward"
          icon={<ArrowRight size={14} />}
          label="Forward"
          onClick={() => executeAction('forward')}
        />,
        <MenuItem
          key="reload"
          icon={<RefreshCw size={14} />}
          label="Reload"
          onClick={() => executeAction('reload')}
        />,
        <MenuSeparator key="sep-page-1" />,
        <MenuItem
          key="view-source"
          icon={<FileCode size={14} />}
          label="View Page Source"
          onClick={() => executeAction('view-source')}
        />
      )
    }

    // Always append Inspect Element at the end
    if (items.length > 0 && (items[items.length - 1] as any).type !== MenuSeparator)
      items.push(<MenuSeparator key="sep-final" />)
    items.push(
      <MenuItem
        key="inspect"
        icon={<Terminal size={14} />}
        label="Inspect Element"
        onClick={() => executeAction('inspect')}
      />
    )

    return items
  }

  // Calculate safe position
  const menuWidth = 260
  const menuMaxHeight = 400
  const safeX = params ? Math.min(params.x, window.innerWidth - menuWidth - 10) : 0
  const safeY = params ? Math.min(params.y, window.innerHeight - menuMaxHeight - 10) : 0

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ left: safeX, top: safeY, width: menuWidth }}
            className="absolute bg-[#1a1a1e]/95 backdrop-blur-2xl border border-white/10 rounded-xl premium-shadow py-1.5 flex flex-col overflow-y-auto max-h-[400px] no-scrollbar text-[13px] font-medium text-text-secondary pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {renderItems()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MenuItem = ({
  icon,
  label,
  onClick
}: {
  icon?: React.ReactNode
  label: string
  onClick: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-3 py-1.5 hover:bg-[var(--color-accent)]/20 hover:text-white transition-colors w-full text-left outline-none focus:bg-[var(--color-accent)]/20 focus:text-white"
    >
      {icon && <span className="mr-2 opacity-70">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}

const MenuSeparator = () => <div className="h-px bg-white/10 my-1 mx-2" />
