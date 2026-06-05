import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

// Get user data path for the database file
const dbPath = join(app.getPath('userData'), 'history.db')

// Initialize SQLite Database
export const db = new Database(dbPath, {
  // verbose: console.log
})

// Use WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL')

// Initialize Schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      visitCount INTEGER DEFAULT 1,
      typedCount INTEGER DEFAULT 0,
      lastVisited INTEGER NOT NULL,
      favicon TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
    CREATE INDEX IF NOT EXISTS idx_history_title ON history(title);
    CREATE INDEX IF NOT EXISTS idx_history_lastVisited ON history(lastVisited);
  `)
}

export interface HistoryEntry {
  id?: number
  url: string
  title: string
  visitCount: number
  typedCount: number
  lastVisited: number
  favicon?: string
}
