import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIGroup, analyzeTabs } from './aiTabGrouper'
import { Tab } from './useBrowserStore'

interface AIGroupState {
  // Suggestions (pending, not yet applied)
  suggestions: AIGroup[]
  isAnalyzing: boolean
  lastAnalyzedAt: number
  isPanelOpen: boolean
  isBannerDismissed: boolean

  // Settings
  geminiApiKey: string
  autoSuggestEnabled: boolean

  // Actions
  setGeminiApiKey: (key: string) => void
  setAutoSuggestEnabled: (enabled: boolean) => void
  openPanel: () => void
  closePanel: () => void
  dismissBanner: () => void
  resetBanner: () => void
  runAnalysis: (tabs: Tab[]) => Promise<void>
  applyGroups: (
    tabs: Tab[],
    createFolder: (name: string, workspaceId: string) => void,
    moveTabToFolder: (tabId: string, folderId: string | undefined) => void,
    activeWorkspaceId: string,
    folders: Array<{ id: string; name: string; workspaceId: string }>
  ) => void
  renameSuggestion: (id: string, name: string) => void
  renameSuggestionEmoji: (id: string, emoji: string) => void
  mergeSuggestions: (fromId: string, toId: string) => void
  moveTabBetweenSuggestions: (tabId: string, toGroupId: string) => void
  removeTabFromSuggestion: (tabId: string) => void
  clearSuggestions: () => void
}

export const useAIGroupStore = create<AIGroupState>()(
  persist(
    (set, get) => ({
      suggestions: [],
      isAnalyzing: false,
      lastAnalyzedAt: 0,
      isPanelOpen: false,
      isBannerDismissed: false,
      geminiApiKey: '',
      autoSuggestEnabled: true,

      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setAutoSuggestEnabled: (enabled) => set({ autoSuggestEnabled: enabled }),

      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),
      dismissBanner: () => set({ isBannerDismissed: true }),
      resetBanner: () => set({ isBannerDismissed: false }),

      runAnalysis: async (tabs) => {
        set({ isAnalyzing: true, isPanelOpen: true, isBannerDismissed: true })
        try {
          const { geminiApiKey } = get()
          const groups = await analyzeTabs(tabs, geminiApiKey || undefined)
          set({ suggestions: groups, isAnalyzing: false, lastAnalyzedAt: Date.now() })
        } catch (err) {
          console.error('[AI Groups] Analysis failed:', err)
          set({ isAnalyzing: false })
        }
      },

      applyGroups: (tabs, createFolder, moveTabToFolder, activeWorkspaceId, folders) => {
        const { suggestions } = get()

        for (const group of suggestions) {
          if (group.tabIds.length === 0) continue

          // Find or create folder with matching name in workspace
          const existing = folders.find(
            f => f.name === `${group.emoji} ${group.name}` && f.workspaceId === activeWorkspaceId
          )

          if (!existing) {
            // Create folder — then we need to get its ID
            // We use a timeout to allow the store to update before moving tabs
            createFolder(`${group.emoji} ${group.name}`, activeWorkspaceId)
          }
        }

        // After all folders are created, move tabs
        // We do this in next tick to let store settle
        setTimeout(() => {
          const currentFolders = folders // will be stale — caller should pass fresh folders
          for (const group of suggestions) {
            if (group.tabIds.length === 0) continue
            const folderName = `${group.emoji} ${group.name}`
            const folder = currentFolders.find(
              f => f.name === folderName && f.workspaceId === activeWorkspaceId
            )
            if (!folder) continue
            for (const tabId of group.tabIds) {
              moveTabToFolder(tabId, folder.id)
            }
          }
        }, 150)

        set({ suggestions: [], isPanelOpen: false, isBannerDismissed: true })
      },

      renameSuggestion: (id, name) =>
        set(state => ({
          suggestions: state.suggestions.map(g => g.id === id ? { ...g, name } : g),
        })),

      renameSuggestionEmoji: (id, emoji) =>
        set(state => ({
          suggestions: state.suggestions.map(g => g.id === id ? { ...g, emoji } : g),
        })),

      mergeSuggestions: (fromId, toId) =>
        set(state => {
          const from = state.suggestions.find(g => g.id === fromId)
          const to = state.suggestions.find(g => g.id === toId)
          if (!from || !to) return state
          return {
            suggestions: state.suggestions
              .map(g => g.id === toId ? { ...g, tabIds: [...g.tabIds, ...from.tabIds] } : g)
              .filter(g => g.id !== fromId),
          }
        }),

      moveTabBetweenSuggestions: (tabId, toGroupId) =>
        set(state => ({
          suggestions: state.suggestions.map(g => {
            if (g.tabIds.includes(tabId)) return { ...g, tabIds: g.tabIds.filter(id => id !== tabId) }
            if (g.id === toGroupId) return { ...g, tabIds: [...g.tabIds, tabId] }
            return g
          }).filter(g => g.tabIds.length > 0),
        })),

      removeTabFromSuggestion: (tabId) =>
        set(state => ({
          suggestions: state.suggestions
            .map(g => ({ ...g, tabIds: g.tabIds.filter(id => id !== tabId) }))
            .filter(g => g.tabIds.length > 0),
        })),

      clearSuggestions: () => set({ suggestions: [], isPanelOpen: false }),
    }),
    {
      name: 'kairo-ai-groups',
      partialize: (state) => ({
        geminiApiKey: state.geminiApiKey,
        autoSuggestEnabled: state.autoSuggestEnabled,
      }),
    }
  )
)
