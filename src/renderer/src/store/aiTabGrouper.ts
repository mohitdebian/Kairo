import { Tab } from './useBrowserStore'

export interface AIGroup {
  id: string
  name: string
  emoji: string
  tabIds: string[]
  color: string
}

// ─── Category taxonomy ──────────────────────────────────────────────────────

interface Category {
  name: string
  emoji: string
  color: string
  domains: string[]
  keywords: string[]
}

const CATEGORIES: Category[] = [
  {
    name: 'Development',
    emoji: '💻',
    color: '#6366f1',
    domains: ['github.com', 'gitlab.com', 'stackoverflow.com', 'npmjs.com', 'crates.io', 'pkg.go.dev', 'pypi.org', 'docs.rs', 'developer.mozilla.org', 'devdocs.io', 'codepen.io', 'codesandbox.io', 'replit.com', 'vercel.com', 'netlify.com', 'railway.app', 'render.com', 'heroku.com', 'digitalocean.com', 'aws.amazon.com', 'console.cloud.google.com', 'portal.azure.com', 'jira.atlassian.com', 'linear.app'],
    keywords: ['github', 'code', 'programming', 'dev', 'api', 'documentation', 'docs', 'tutorial', 'library', 'framework', 'npm', 'rust', 'python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'docker', 'kubernetes', 'git', 'commit', 'pull request', 'issue', 'bug', 'feature', 'deploy', 'build', 'compile', 'debug', 'test', 'lint', 'webpack', 'vite', 'nextjs', 'electron'],
  },
  {
    name: 'Learning',
    emoji: '📚',
    color: '#8b5cf6',
    domains: ['coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'pluralsight.com', 'egghead.io', 'frontendmasters.com', 'freecodecamp.org', 'theodinproject.com', 'leetcode.com', 'hackerrank.com', 'codewars.com', 'exercism.org', 'brilliant.org', 'skillshare.com', 'linkedin.com/learning', 'medium.com', 'dev.to', 'hashnode.com', 'substack.com'],
    keywords: ['learn', 'course', 'tutorial', 'lesson', 'lecture', 'study', 'education', 'university', 'college', 'school', 'class', 'guide', 'handbook', 'book', 'read', 'chapter', 'introduction to', 'how to', 'beginner', 'advanced', 'master', 'complete guide', 'crash course', 'roadmap', 'quiz', 'exercise', 'problem'],
  },
  {
    name: 'Shopping',
    emoji: '🛒',
    color: '#f59e0b',
    domains: ['amazon.com', 'amazon.in', 'flipkart.com', 'myntra.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com', 'bestbuy.com', 'newegg.com', 'aliexpress.com', 'shopify.com', 'meesho.com', 'nykaa.com', 'ajio.com', 'snapdeal.com', 'paytmmall.com', 'tatacliq.com'],
    keywords: ['shop', 'buy', 'cart', 'order', 'price', 'deal', 'discount', 'sale', 'offer', 'product', 'review', 'shipping', 'delivery', 'checkout', 'wishlist', 'compare', 'best', 'cheap', 'affordable', 'premium'],
  },
  {
    name: 'Entertainment',
    emoji: '🎬',
    color: '#ef4444',
    domains: ['youtube.com', 'netflix.com', 'primevideo.com', 'hotstar.com', 'hulu.com', 'disneyplus.com', 'hbomax.com', 'twitch.tv', 'crunchyroll.com', 'spotify.com', 'music.youtube.com', 'soundcloud.com', 'apple.com/tv', 'peacocktv.com', 'paramountplus.com', 'imdb.com', 'rottentomatoes.com'],
    keywords: ['watch', 'movie', 'film', 'series', 'episode', 'season', 'anime', 'manga', 'stream', 'play', 'music', 'song', 'album', 'artist', 'playlist', 'video', 'trailer', 'review', 'rating', 'show', 'game', 'gaming', 'esports'],
  },
  {
    name: 'News',
    emoji: '📰',
    color: '#64748b',
    domains: ['news.google.com', 'bbc.com', 'cnn.com', 'theguardian.com', 'nytimes.com', 'wsj.com', 'reuters.com', 'apnews.com', 'ndtv.com', 'timesofindia.com', 'hindustantimes.com', 'thehindu.com', 'techcrunch.com', 'theverge.com', 'wired.com', 'ars technica.com', 'hacker news', 'reddit.com', 'hackernews.com', 'news.ycombinator.com', 'arstechnica.com'],
    keywords: ['news', 'article', 'breaking', 'latest', 'update', 'report', 'analysis', 'opinion', 'editorial', 'politics', 'world', 'business', 'technology', 'science', 'health', 'sports', 'weather', 'economy', 'market'],
  },
  {
    name: 'Social',
    emoji: '💬',
    color: '#06b6d4',
    domains: ['twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'linkedin.com', 'discord.com', 'slack.com', 'telegram.org', 'whatsapp.com', 'threads.net', 'reddit.com', 'mastodon.social', 'tiktok.com', 'snapchat.com', 'pinterest.com', 'quora.com'],
    keywords: ['post', 'tweet', 'message', 'chat', 'comment', 'reply', 'follow', 'share', 'like', 'feed', 'profile', 'timeline', 'notification', 'community', 'group', 'forum', 'discuss', 'network'],
  },
  {
    name: 'Finance',
    emoji: '💰',
    color: '#10b981',
    domains: ['zerodha.com', 'groww.in', 'coinbase.com', 'binance.com', 'robinhood.com', 'etrade.com', 'fidelity.com', 'vanguard.com', 'schwab.com', 'tradingview.com', 'moneycontrol.com', 'economictimes.com', 'bloomberg.com', 'finance.yahoo.com', 'google.com/finance', 'paypal.com', 'stripe.com', 'razorpay.com'],
    keywords: ['stock', 'crypto', 'invest', 'portfolio', 'trade', 'market', 'price', 'chart', 'returns', 'dividend', 'fund', 'etf', 'bitcoin', 'ethereum', 'finance', 'bank', 'payment', 'wallet', 'budget', 'tax'],
  },
  {
    name: 'AI & Tools',
    emoji: '🤖',
    color: '#a855f7',
    domains: ['chat.openai.com', 'chatgpt.com', 'claude.ai', 'gemini.google.com', 'bard.google.com', 'perplexity.ai', 'midjourney.com', 'stability.ai', 'huggingface.co', 'replicate.com', 'runway.ml', 'notion.so', 'linear.app', 'figma.com', 'canva.com', 'miro.com', 'airtable.com'],
    keywords: ['ai', 'chatgpt', 'claude', 'gemini', 'prompt', 'generate', 'model', 'llm', 'machine learning', 'neural', 'artificial intelligence', 'automation', 'workflow', 'productivity', 'tool', 'nocode'],
  },
  {
    name: 'Design',
    emoji: '🎨',
    color: '#ec4899',
    domains: ['figma.com', 'dribbble.com', 'behance.net', 'canva.com', 'adobe.com', 'sketch.com', 'framer.com', 'webflow.com', 'fonts.google.com', 'coolors.co', 'unsplash.com', 'pexels.com', 'undraw.co', 'heroicons.com', 'lucide.dev', 'radix-ui.com', 'ui.shadcn.com'],
    keywords: ['design', 'ui', 'ux', 'color', 'font', 'typography', 'icon', 'illustration', 'prototype', 'wireframe', 'mockup', 'figma', 'sketch', 'brand', 'logo', 'creative', 'layout', 'component'],
  },
  {
    name: 'Docs & Reference',
    emoji: '📖',
    color: '#f97316',
    domains: ['docs.google.com', 'drive.google.com', 'notion.so', 'confluence.atlassian.com', 'wikipedia.org', 'en.wikipedia.org', 'w3schools.com', 'mdn.mozilla.org', 'developer.apple.com', 'docs.microsoft.com', 'learn.microsoft.com', 'cloud.google.com/docs', 'aws.amazon.com/documentation', 'readthedocs.io', 'gitbook.io'],
    keywords: ['documentation', 'reference', 'manual', 'spec', 'rfc', 'proposal', 'wiki', 'guide', 'overview', 'getting started', 'installation', 'configuration', 'api reference', 'changelog', 'readme'],
  },
]

// ─── Utilities ───────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

const STOP_WORDS = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'has', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'she', 'use', 'may', 'com', 'www', 'http', 'https', 'org', 'net'])

function scoreTabForCategory(tab: Tab, cat: Category): number {
  let score = 0
  const domain = extractDomain(tab.url)
  const text = `${tab.title} ${tab.url}`.toLowerCase()
  const tokens = tokenize(tab.title + ' ' + domain).filter(t => !STOP_WORDS.has(t))

  // Domain exact match = high score
  if (cat.domains.some(d => domain === d || domain.endsWith('.' + d) || domain.includes(d))) {
    score += 10
  }

  // Keyword matches
  for (const kw of cat.keywords) {
    if (text.includes(kw)) {
      score += kw.split(' ').length > 1 ? 4 : 2 // multi-word bonus
    }
  }

  // Token overlap
  for (const token of tokens) {
    if (cat.keywords.includes(token)) score += 1
  }

  return score
}

function assignCategory(tab: Tab): Category | null {
  if (!tab.url || tab.url === 'dashboard') return null

  let best: Category | null = null
  let bestScore = 0

  for (const cat of CATEGORIES) {
    const score = scoreTabForCategory(tab, cat)
    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  }

  return bestScore >= 2 ? best : null
}

// ─── Heuristic grouper ───────────────────────────────────────────────────────

export function groupTabsHeuristic(tabs: Tab[]): AIGroup[] {
  const real = tabs.filter(t => t.url && t.url !== 'dashboard')
  const grouped = new Map<string, { cat: Category; tabIds: string[] }>()
  const ungrouped: string[] = []

  for (const tab of real) {
    const cat = assignCategory(tab)
    if (cat) {
      const key = cat.name
      if (!grouped.has(key)) grouped.set(key, { cat, tabIds: [] })
      grouped.get(key)!.tabIds.push(tab.id)
    } else {
      ungrouped.push(tab.id)
    }
  }

  // Domain-cluster ungrouped tabs
  const domainGroups = new Map<string, string[]>()
  for (const tabId of ungrouped) {
    const tab = tabs.find(t => t.id === tabId)!
    const domain = extractDomain(tab.url)
    if (domain) {
      if (!domainGroups.has(domain)) domainGroups.set(domain, [])
      domainGroups.get(domain)!.push(tabId)
    }
  }

  // Multi-tab domains become their own group
  const stillUngrouped: string[] = []
  for (const [domain, tabIds] of domainGroups.entries()) {
    if (tabIds.length >= 2) {
      const name = domain.split('.')[0]
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
      grouped.set(`domain:${domain}`, {
        cat: { name: capitalized, emoji: '🌐', color: '#64748b', domains: [domain], keywords: [] },
        tabIds,
      })
    } else {
      stillUngrouped.push(...tabIds)
    }
  }

  // Merge remaining single tabs into "Other" if any
  const result: AIGroup[] = []
  for (const [, { cat, tabIds }] of grouped.entries()) {
    if (tabIds.length === 0) continue
    result.push({
      id: `ag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cat.name,
      emoji: cat.emoji,
      color: cat.color,
      tabIds,
    })
  }

  if (stillUngrouped.length > 0) {
    result.push({
      id: `ag-other-${Date.now()}`,
      name: 'Other',
      emoji: '📂',
      color: '#475569',
      tabIds: stillUngrouped,
    })
  }

  // Sort by tab count descending
  return result.sort((a, b) => b.tabIds.length - a.tabIds.length)
}

// ─── Gemini grouper ──────────────────────────────────────────────────────────

export async function groupTabsWithGemini(tabs: Tab[], apiKey: string): Promise<AIGroup[]> {
  const real = tabs.filter(t => t.url && t.url !== 'dashboard')
  if (real.length === 0) return []

  const tabList = real.map((t, i) => `${i + 1}. title="${t.title}" url="${t.url}"`).join('\n')

  const prompt = `You are a browser tab organizer. Analyze these browser tabs and group them into meaningful categories.

Tabs:
${tabList}

Instructions:
- Group related tabs together into logical categories
- Each group should have a descriptive name (2-4 words max), an appropriate emoji, and the tab numbers
- Create 2-8 groups based on the content
- Every tab must be in exactly one group
- Use common sense categories like: Development, Learning, Shopping, Entertainment, News, Social, Finance, AI Tools, Design, Research, etc.

Respond ONLY with valid JSON in this exact format:
[
  { "name": "Group Name", "emoji": "🎯", "tabNumbers": [1, 3, 7] },
  { "name": "Another Group", "emoji": "💻", "tabNumbers": [2, 4, 5, 6] }
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`)
    const data = await response.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract JSON from response (may have markdown fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed: Array<{ name: string; emoji: string; tabNumbers: number[] }> = JSON.parse(jsonMatch[0])

    const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#ec4899', '#f97316']
    return parsed.map((g, i) => ({
      id: `ag-${Date.now()}-${i}`,
      name: g.name,
      emoji: g.emoji,
      color: COLORS[i % COLORS.length],
      tabIds: g.tabNumbers.map(n => real[n - 1]?.id).filter(Boolean) as string[],
    })).filter(g => g.tabIds.length > 0)
  } catch (err) {
    console.warn('[AI Groups] Gemini failed, falling back to heuristic:', err)
    return groupTabsHeuristic(tabs)
  }
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function analyzeTabs(tabs: Tab[], geminiApiKey?: string): Promise<AIGroup[]> {
  const real = tabs.filter(t => t.url && t.url !== 'dashboard')
  if (real.length === 0) return []

  if (geminiApiKey && geminiApiKey.length > 10) {
    return groupTabsWithGemini(tabs, geminiApiKey)
  }
  return groupTabsHeuristic(tabs)
}
