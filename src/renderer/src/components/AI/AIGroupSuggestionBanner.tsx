import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useAIGroupStore } from '../../store/useAIGroupStore'
import { useBrowserStore } from '../../store/useBrowserStore'

export const AIGroupSuggestionBanner = () => {
  const tabs = useBrowserStore((s) => s.tabs)
  const activeWorkspaceId = useBrowserStore((s) => s.activeWorkspaceId)
  const folders = useBrowserStore((s) => s.folders)

  const { isBannerDismissed, autoSuggestEnabled, isAnalyzing, runAnalysis, dismissBanner } =
    useAIGroupStore()

  // Only count ungrouped real tabs in the active workspace
  const ungroupedTabs = tabs.filter(
    (t) =>
      t.workspaceId === activeWorkspaceId &&
      !t.folderId &&
      !t.pinned &&
      t.url &&
      t.url !== 'dashboard'
  )
  const totalTabs = tabs.filter(
    (t) => t.workspaceId === activeWorkspaceId && t.url && t.url !== 'dashboard'
  )

  const shouldShow =
    autoSuggestEnabled &&
    !isBannerDismissed &&
    ungroupedTabs.length >= 4 &&
    folders.filter((f) => f.workspaceId === activeWorkspaceId).length === 0

  const handleGroup = () => {
    runAnalysis(totalTabs)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="mx-2 mb-3 rounded-xl overflow-hidden"
        >
          {/* Glassmorphism card */}
          <div className="relative bg-gradient-to-br from-[#1e1033] to-[#0f0a1a] border border-purple-500/20 rounded-xl p-3 shadow-lg shadow-purple-500/5">
            {/* Animated glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />

            <div className="relative flex items-start gap-2.5">
              {/* Icon with pulse */}
              <div className="relative mt-0.5 shrink-0">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-purple-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/90 leading-tight">
                  Organize {ungroupedTabs.length} tabs with AI
                </p>
                <p className="text-[11px] text-white/40 mt-0.5 leading-tight">
                  Group into topics automatically
                </p>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={handleGroup}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="w-3 h-3 border border-purple-400/50 border-t-purple-400 rounded-full animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} />
                        Group Tabs
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={dismissBanner}
                className="p-1 rounded-md hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
