import { db, HistoryEntry } from '../db/database'

export class HistoryManager {
  static addVisit(url: string, title: string, favicon?: string) {
    if (!url || url.includes('devtools://') || url.includes('chrome-extension://') || url === 'dashboard' || url === 'kairo://history') {
      return
    }

    try {
      const existing = db.prepare('SELECT id, visitCount, lastVisited FROM history WHERE url = ?').get(url) as any

      if (existing) {
        // Only increment visitCount if the last visit was more than 1 hour ago
        const now = Date.now()
        const oneHour = 60 * 60 * 1000
        const shouldIncrement = now - existing.lastVisited > oneHour
        
        const stmt = db.prepare(`
          UPDATE history 
          SET title = ?, visitCount = visitCount + ?, lastVisited = ?, favicon = COALESCE(?, favicon)
          WHERE url = ?
        `)
        stmt.run(title, shouldIncrement ? 1 : 0, now, favicon || null, url)
      } else {
        // Insert new entry
        const stmt = db.prepare(`
          INSERT INTO history (url, title, visitCount, typedCount, lastVisited, favicon)
          VALUES (?, ?, 1, 0, ?, ?)
        `)
        stmt.run(url, title, Date.now(), favicon || null)
      }
    } catch (err) {
      console.error('Failed to add visit to history:', err)
    }
  }

  static incrementTypedCount(url: string) {
    try {
      const stmt = db.prepare('UPDATE history SET typedCount = typedCount + 1 WHERE url = ?')
      stmt.run(url)
    } catch (err) {
      console.error('Failed to increment typed count:', err)
    }
  }

  static updateFavicon(url: string, favicon: string) {
    try {
      const stmt = db.prepare('UPDATE history SET favicon = ? WHERE url = ?')
      stmt.run(favicon, url)
    } catch (err) {
      console.error('Failed to update favicon:', err)
    }
  }

  static getRecentHistory(limit: number = 100): HistoryEntry[] {
    try {
      return db.prepare('SELECT * FROM history ORDER BY lastVisited DESC LIMIT ?').all(limit) as HistoryEntry[]
    } catch (err) {
      console.error('Failed to get recent history:', err)
      return []
    }
  }

  static searchHistory(query: string, limit: number = 20): HistoryEntry[] {
    try {
      // Very basic LIKE search for fallback; RankingEngine will do the complex fuzzy matching
      const searchTerm = `%${query}%`
      return db.prepare(`
        SELECT * FROM history 
        WHERE url LIKE ? OR title LIKE ?
        ORDER BY lastVisited DESC
        LIMIT ?
      `).all(searchTerm, searchTerm, limit) as HistoryEntry[]
    } catch (err) {
      console.error('Failed to search history:', err)
      return []
    }
  }
  
  static searchOmnibox(query: string, limit: number = 8): HistoryEntry[] {
    try {
      if (!query.trim()) return []
      
      const likeQuery = `%${query}%`
      const prefixQuery = `${query}%`
      
      return db.prepare(`
        SELECT *, 
               (visitCount * 10 + typedCount * 50) AS score
        FROM history 
        WHERE url LIKE ? OR title LIKE ?
        ORDER BY 
          CASE WHEN url LIKE ? THEN 1 ELSE 0 END DESC,
          CASE WHEN title LIKE ? THEN 1 ELSE 0 END DESC,
          score DESC,
          lastVisited DESC
        LIMIT ?
      `).all(likeQuery, likeQuery, prefixQuery, prefixQuery, limit) as HistoryEntry[]
    } catch (err) {
      console.error('Failed to search omnibox:', err)
      return []
    }
  }

  static deleteVisit(url: string) {
    try {
      db.prepare('DELETE FROM history WHERE url = ?').run(url)
    } catch (err) {
      console.error('Failed to delete history entry:', err)
    }
  }

  static clearHistory() {
    try {
      db.prepare('DELETE FROM history').run()
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }
}
