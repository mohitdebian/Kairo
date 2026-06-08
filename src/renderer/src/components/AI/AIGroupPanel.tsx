import React, { useState, useRef } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Merge,
  Folder,
  GripVertical,
  ArrowRight
} from 'lucide-react'
import { useAIGroupStore } from '../../store/useAIGroupStore'
import { useBrowserStore } from '../../store/useBrowserStore'
import { AIGroup } from '../../store/aiTabGrouper'
import { cn } from '../../utils/cn'

const EMOJI_OPTIONS = [
  '📚',
  '💻',
  '🛒',
  '🎬',
  '📰',
  '💬',
  '💰',
  '🤖',
  '🎨',
  '📖',
  '🌐',
  '📂',
  '🔬',
  '🎮',
  '✈️',
  '🍕',
  '💡',
  '🔧',
  '📊',
  '🎯'
]

// ─── Tab preview inside a group ───────────────────────────────────────────────
const TabPreview = ({ tabId, groupId }: { tabId: string; groupId: string }) => {
  const tab = useBrowserStore((s) => s.tabs.find((t) => t.id === tabId))
  const { suggestions, moveTabBetweenSuggestions, removeTabFromSuggestion } = useAIGroupStore()
  const [showMove, setShowMove] = useState(false)

  if (!tab) return null

  const favicon =
    tab.favicon ||
    (tab.url?.startsWith('http')
      ? `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=32`
      : null)

  const title = tab.title || tab.url || 'Untitled'

  return (
    <div
      className="group/tab flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors relative"
      onMouseLeave={() => setShowMove(false)}
    >
      {/* Favicon */}
      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="w-3.5 h-3.5 object-contain rounded-sm"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-3.5 h-3.5 rounded-sm bg-white/10" />
        )}
      </div>
      <span className="text-[11px] text-white/60 flex-1 truncate">{title}</span>

      {/* Actions on hover */}
      <div className="hidden group-hover/tab:flex items-center gap-1 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowMove((v) => !v)}
            className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
            title="Move to another group"
          >
            <ArrowRight size={11} />
          </button>
          {showMove && (
            <div className="absolute right-0 bottom-full mb-1 z-50 bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px] py-1">
              {suggestions
                .filter((g) => g.id !== groupId)
                .map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      moveTabBetweenSuggestions(tabId, g.id)
                      setShowMove(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 flex items-center gap-1.5"
                  >
                    <span>{g.emoji}</span>
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <button
          onClick={() => removeTabFromSuggestion(tabId)}
          className="p-0.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
          title="Remove from group"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── Single group card ────────────────────────────────────────────────────────
const GroupCard = ({ group, index, total }: { group: AIGroup; index: number; total: number }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingEmoji, setIsEditingEmoji] = useState(false)
  const [nameInput, setNameInput] = useState(group.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const { renameSuggestion, renameSuggestionEmoji, mergeSuggestions, suggestions } =
    useAIGroupStore()

  const submitRename = () => {
    if (nameInput.trim()) renameSuggestion(group.id, nameInput.trim())
    setIsEditingName(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 35 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingEmoji((v) => !v)
            }}
            className="text-base w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
            title="Change emoji"
          >
            {group.emoji}
          </button>
          {isEditingEmoji && (
            <div
              className="absolute left-0 top-full mt-1 z-50 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-5 gap-1 w-[160px]"
              onClick={(e) => e.stopPropagation()}
            >
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  onClick={() => {
                    renameSuggestionEmoji(group.id, em)
                    setIsEditingEmoji(false)
                  }}
                  className="text-base w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        {isEditingName ? (
          <input
            ref={inputRef}
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') {
                setIsEditingName(false)
                setNameInput(group.name)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none text-[13px] font-semibold text-white border-b border-purple-500/50 pb-0.5"
          />
        ) : (
          <span
            className="flex-1 text-[13px] font-semibold text-white/90 truncate"
            onDoubleClick={(e) => {
              e.stopPropagation()
              setIsEditingName(true)
            }}
            title="Double-click to rename"
          >
            {group.name}
          </span>
        )}

        {/* Tab count */}
        <span
          className="text-[11px] text-white/30 font-mono shrink-0 px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: `${group.color}20` }}
        >
          {group.tabIds.length}
        </span>

        {/* Expand/collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded((v) => !v)
          }}
          className="text-white/30 hover:text-white/60 transition-colors shrink-0"
        >
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Color accent line */}
      <div className="h-px mx-3" style={{ backgroundColor: `${group.color}40` }} />

      {/* Tabs list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-1 py-1">
              {group.tabIds.map((tabId) => (
                <TabPreview key={tabId} tabId={tabId} groupId={group.id} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merge with next group */}
      {index < total - 1 && (
        <div className="px-3 pb-2 flex justify-end">
          <button
            onClick={() => {
              const next = suggestions[index + 1]
              if (next) mergeSuggestions(group.id, next.id)
            }}
            className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/50 transition-colors py-0.5 px-1.5 rounded hover:bg-white/5"
          >
            <Merge size={10} />
            Merge with next
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export const AIGroupPanel = () => {
  const { isPanelOpen, isAnalyzing, suggestions, closePanel, runAnalysis, clearSuggestions } =
    useAIGroupStore()

  const store = useBrowserStore()
  const { tabs, activeWorkspaceId, folders, createFolder, moveTabToFolder } = store

  const workspaceTabs = tabs.filter(
    (t) => t.workspaceId === activeWorkspaceId && t.url && t.url !== 'dashboard'
  )
  const totalCovered = suggestions.reduce((acc, g) => acc + g.tabIds.length, 0)

  const handleApply = () => {
    // Step 1: create all folders
    const folderNames = suggestions.map((g) => `${g.emoji} ${g.name}`)
    for (const name of folderNames) {
      const exists = folders.some((f) => f.name === name && f.workspaceId === activeWorkspaceId)
      if (!exists) createFolder(name, activeWorkspaceId)
    }

    // Step 2: move tabs after store settles
    setTimeout(() => {
      const freshFolders = useBrowserStore.getState().folders
      for (const group of suggestions) {
        const folderName = `${group.emoji} ${group.name}`
        const folder = freshFolders.find(
          (f) => f.name === folderName && f.workspaceId === activeWorkspaceId
        )
        if (!folder) continue
        for (const tabId of group.tabIds) {
          moveTabToFolder(tabId, folder.id)
        }
      }
      clearSuggestions()
    }, 100)
  }

  const handleReanalyze = () => {
    runAnalysis(workspaceTabs)
  }

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="relative h-full bg-[#0c0c10] border-r border-white/[0.06] flex flex-col shadow-2xl shrink-0 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 pt-5 pb-4 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-white tracking-tight">AI Tab Groups</h2>
                  <p className="text-[11px] text-white/40">
                    {isAnalyzing
                      ? 'Analyzing your tabs…'
                      : suggestions.length > 0
                        ? `${totalCovered} tabs → ${suggestions.length} groups`
                        : 'Ready to organize'}
                  </p>
                </div>
              </div>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
            {isAnalyzing ? (
              // Loading state
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
                  <div
                    className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-b-indigo-400 animate-spin"
                    style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-white/70">
                    Analyzing {workspaceTabs.length} tabs
                  </p>
                  <p className="text-[11px] text-white/30 mt-1">Grouping by topic and context…</p>
                </div>
              </div>
            ) : suggestions.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Folder size={20} className="text-white/20" />
                </div>
                <p className="text-[13px] font-medium text-white/50">No suggestions yet</p>
                <p className="text-[11px] text-white/25">
                  Click "Analyze" to group your tabs automatically
                </p>
                <button
                  onClick={handleReanalyze}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 text-purple-300 text-[12px] font-semibold transition-all"
                >
                  <Sparkles size={13} />
                  Analyze {workspaceTabs.length} Tabs
                </button>
              </div>
            ) : (
              // Groups list
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold px-1 mb-1">
                  Suggested Groups · Double-click to rename
                </p>
                <AnimatePresence mode="popLayout">
                  {suggestions.map((group, i) => (
                    <GroupCard key={group.id} group={group} index={i} total={suggestions.length} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer actions */}
          {!isAnalyzing && suggestions.length > 0 && (
            <div className="px-3 py-4 border-t border-white/[0.05] flex flex-col gap-2 shrink-0">
              <button
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[13px] font-semibold transition-all shadow-lg shadow-purple-500/20"
              >
                <Check size={14} />
                Apply {suggestions.length} Groups
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleReanalyze}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-white/50 hover:text-white/80 text-[12px] font-medium transition-all"
                >
                  <RotateCcw size={12} />
                  Re-analyze
                </button>
                <button
                  onClick={clearSuggestions}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/[0.08] hover:bg-red-500/10 hover:border-red-500/20 text-white/50 hover:text-red-400 text-[12px] font-medium transition-all"
                >
                  <X size={12} />
                  Discard
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
