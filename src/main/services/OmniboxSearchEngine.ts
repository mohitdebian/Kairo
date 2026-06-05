import { HistoryManager } from './HistoryManager'
import { RankingEngine, OmniboxResult } from './RankingEngine'

export class OmniboxSearchEngine {
  static search(query: string, activeTabs: any[], bookmarks: any[] = []): OmniboxResult[] {
    if (!query || query.trim() === '') {
      return []
    }

    const q = query.trim()
    const historyResults = HistoryManager.searchOmnibox(q, 100)

    // Pass data through RankingEngine
    const results = RankingEngine.rankResults(q, historyResults, activeTabs, bookmarks)

    // Return top 20 matches for performance in the UI
    return results.slice(0, 20)
  }
}
