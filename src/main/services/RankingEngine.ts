import { HistoryEntry } from '../db/database'

export interface OmniboxResult {
  id: string
  url: string
  title: string
  type: 'history' | 'bookmark' | 'tab' | 'pinned'
  favicon?: string
  score: number
}

export class RankingEngine {
  static rankResults(
    query: string,
    entries: HistoryEntry[],
    tabs: any[],
    bookmarks: any[]
  ): OmniboxResult[] {
    const q = query.toLowerCase()
    const results: OmniboxResult[] = []

    // Process Tabs
    for (const tab of tabs) {
      if (!tab.url || tab.url === 'dashboard') continue
      const score = this.calculateScore(q, tab.url, tab.title || '', 10, 5, Date.now())
      if (score > 0) {
        results.push({
          id: tab.id,
          url: tab.url,
          title: tab.title || new URL(tab.url).hostname,
          type: tab.pinned ? 'pinned' : 'tab',
          favicon: tab.favicon,
          score: score + 1000 // Boost open tabs heavily
        })
      }
    }

    // Process Bookmarks (if we had them)
    // For now we assume bookmarks are passed in similar format
    for (const b of bookmarks) {
      const score = this.calculateScore(q, b.url, b.title || '', 5, 2, Date.now())
      if (score > 0) {
        results.push({
          id: b.id || b.url,
          url: b.url,
          title: b.title || b.url,
          type: 'bookmark',
          favicon: b.favicon,
          score: score + 500 // Boost bookmarks
        })
      }
    }

    // Process History
    const seenUrls = new Set(results.map((r) => r.url))

    for (const entry of entries) {
      if (seenUrls.has(entry.url)) continue

      const score = this.calculateScore(
        q,
        entry.url,
        entry.title,
        entry.visitCount,
        entry.typedCount,
        entry.lastVisited
      )

      if (score > 0) {
        results.push({
          id: entry.id?.toString() || entry.url,
          url: entry.url,
          title: entry.title,
          type: 'history',
          favicon: entry.favicon,
          score
        })
        seenUrls.add(entry.url)
      }
    }

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score)
  }

  private static calculateScore(
    query: string,
    url: string,
    title: string,
    visitCount: number,
    typedCount: number,
    lastVisited: number
  ): number {
    const urlLower = url.toLowerCase()
    const titleLower = title.toLowerCase()
    let score = 0
    let matchBonus = 0

    // Prefix match
    let hostname = urlLower
    if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
      hostname = hostname.split('/')[2] || hostname
    }

    if (hostname.startsWith(query) || hostname.replace(/^www\./, '').startsWith(query)) {
      matchBonus += 100
    } else if (hostname.includes(query)) {
      matchBonus += 50
    }

    if (titleLower.startsWith(query)) {
      matchBonus += 80
    } else if (titleLower.includes(query)) {
      matchBonus += 40
    }

    if (matchBonus === 0 && !urlLower.includes(query)) {
      // If there's no match at all, score is 0
      return 0
    }

    // Exact Match Bonus
    if (hostname === query || hostname.replace(/^www\./, '') === query) {
      matchBonus += 300
    }

    // Recency Boost
    const now = Date.now()
    const diffHours = (now - lastVisited) / (1000 * 60 * 60)
    let recencyBoost = 0

    if (diffHours < 1) recencyBoost = 50       // Last hour
    else if (diffHours < 24) recencyBoost = 30 // Last day
    else if (diffHours < 168) recencyBoost = 10 // Last week

    // Base Score Formula
    score = (visitCount * 0.5) + (typedCount * 2) + recencyBoost + matchBonus

    return score
  }
}
