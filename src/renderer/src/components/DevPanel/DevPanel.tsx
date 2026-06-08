import { useState } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, X, Bot, Loader2 } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export const DevPanel = () => {
  const isRightPanelOpen = useBrowserStore((state) => state.isRightPanelOpen)
  const toggleRightPanel = useBrowserStore((state) => state.toggleRightPanel)
  const activeWorkspaceId = useBrowserStore((state) => state.activeWorkspaceId)
  const workspaceNotes = useBrowserStore((state) => state.workspaceNotes)
  const updateWorkspaceNote = useBrowserStore((state) => state.updateWorkspaceNote)
  const activeTabId = useBrowserStore((state) => state.activeTabIds[0])
  const activeBrowserTabUrl = useBrowserStore(
    (state) => state.tabs.find((t) => t.id === activeTabId)?.url
  )

  const [activeTab, setActiveTab] = useState<'notes' | 'ai'>('notes')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const currentNote = workspaceNotes[activeWorkspaceId] || ''

  const handleSummarize = () => {
    setIsSummarizing(true)
    setSummary(null)
    // Simulate AI fetch
    setTimeout(() => {
      setSummary(
        `This page (${activeBrowserTabUrl || 'Dashboard'}) appears to be a modern web application interface. It utilizes a highly responsive architecture with split-view capabilities, hardware-accelerated micro-interactions, and a strict minimal aesthetic. The primary focus is on reducing clutter and providing developer-centric quick actions.`
      )
      setIsSummarizing(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isRightPanelOpen && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-80 bg-bg-secondary/40 backdrop-blur-2xl border-l border-white/5 h-full flex flex-col shrink-0 relative z-40 transform-gpu"
        >
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
            <div className="flex bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('notes')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-2',
                  activeTab === 'notes'
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <FileText size={14} /> Notes
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-2',
                  activeTab === 'ai'
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Sparkles size={14} /> Insights
              </button>
            </div>
            <button
              onClick={toggleRightPanel}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {activeTab === 'notes' ? (
              <textarea
                value={currentNote}
                onChange={(e) => updateWorkspaceNote(activeWorkspaceId, e.target.value)}
                placeholder="Jot down notes for this workspace..."
                className="w-full h-full bg-transparent border-none outline-none resize-none text-sm text-text-primary placeholder-text-secondary/50 leading-relaxed"
              />
            ) : (
              <div className="flex flex-col h-full">
                {summary ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-text-primary leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3 text-[var(--color-accent)]">
                      <Bot size={16} />{' '}
                      <span className="font-medium text-xs tracking-wider uppercase">
                        AI Summary
                      </span>
                    </div>
                    {summary}
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary">
                    <Sparkles size={32} className="mb-4 opacity-50" />
                    <p className="text-sm mb-6 max-w-[200px]">
                      Get a smart summary of the current page's content.
                    </p>
                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-md shadow-[var(--color-accent)]/20 disabled:opacity-50"
                    >
                      {isSummarizing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        'Summarize Page'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
