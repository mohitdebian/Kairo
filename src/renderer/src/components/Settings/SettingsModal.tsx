import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBrowserStore } from '../../store/useBrowserStore'
import { useAIGroupStore } from '../../store/useAIGroupStore'
import { X, Trash2, CheckCircle2, Sparkles, Key, Eye, EyeOff } from 'lucide-react'

export const SettingsModal = () => {
  const isSettingsOpen = useBrowserStore(state => state.isSettingsOpen)
  const toggleSettings = useBrowserStore(state => state.toggleSettings)
  const store = useBrowserStore()
  const aiStore = useAIGroupStore()
  const [isClearing, setIsClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleClearCache = async () => {
    setIsClearing(true)
    setCleared(false)
    window.electron.ipcRenderer.send('clear-cache')
    
    // Simulate a tiny delay for UX feedback
    setTimeout(() => {
      setIsClearing(false)
      setCleared(true)
      setTimeout(() => setCleared(false), 3000)
    }, 800)
  }

  if (!isSettingsOpen) return null

  return (
    <div className="absolute inset-0 z-[99999] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={toggleSettings}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg max-h-[85vh] bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl premium-shadow overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.03] bg-white/[0.02] shrink-0">
          <h2 className="text-lg font-semibold text-white">Browser Settings</h2>
          <button onClick={toggleSettings} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Privacy & Security</h3>
            
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">Clear Browsing Data & Cache</span>
                <span className="text-xs text-white/50 mt-0.5">Clears cookies, local storage, indexedDB, and service workers. This will log you out of most sites.</span>
              </div>
              
              <button 
                onClick={handleClearCache}
                disabled={isClearing || cleared}
                className="ml-4 shrink-0 h-9 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {cleared ? (
                  <><CheckCircle2 size={14} /> Cleared</>
                ) : isClearing ? (
                  <span className="animate-pulse">Clearing...</span>
                ) : (
                  <><Trash2 size={14} /> Clear Cache</>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Authentication Bypasses</h3>
            <div className="p-4 rounded-xl border border-[#4285F4]/20 bg-[#4285F4]/5 flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#4285F4]">Native Google Login Bypass</span>
                <span className="text-xs text-white/50 mt-0.5 pr-4">Log into as many Google accounts as you want in the secure Chrome window. When you are completely done, simply close the window to sync all accounts to Kairo!</span>
              </div>
              <button 
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  btn.innerText = 'Awaiting Login...';
                  try {
                    // @ts-ignore - custom api
                    const result = await window.api.importGoogleCookies();
                    if (result.success) {
                      btn.innerText = `Success!`;
                      setTimeout(() => { btn.innerText = originalText }, 3000);
                    } else {
                      btn.innerText = 'Failed or Cancelled';
                      setTimeout(() => { btn.innerText = originalText }, 3000);
                    }
                  } catch (err) {
                    btn.innerText = 'Error';
                    setTimeout(() => { btn.innerText = originalText }, 3000);
                  }
                }}
                className="ml-4 shrink-0 h-9 px-4 rounded-lg bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 font-medium text-xs transition-colors"
              >
                Login via Chrome
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Performance</h3>
            
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Sleeping Tabs</span>
                  <span className="text-xs text-white/50 mt-0.5">Automatically free memory from inactive tabs</span>
                </div>
                <button 
                  onClick={() => {
                    store.setSleepingTabsEnabled(!store.sleepingTabsEnabled)
                  }}
                  className={`w-10 h-5 rounded-full transition-colors relative ${store.sleepingTabsEnabled ? 'bg-[var(--color-accent)]' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${store.sleepingTabsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              
              {store.sleepingTabsEnabled && (
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white/70">Sleep After</span>
                    <span className="text-xs text-white/40 mt-0.5">Minutes of inactivity before sleeping</span>
                  </div>
                  <div className="relative group">
                    <select 
                      value={store.sleepingTabsTimeout}
                      onChange={(e) => store.setSleepingTabsTimeout(Number(e.target.value))}
                      className="appearance-none bg-[#1a1a1e]/80 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-sm text-white outline-none focus:border-[var(--color-accent)]/50 cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={1440}>Never</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">About Kairo</h3>
            
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col gap-1">
              <span className="text-sm font-medium text-white">Kairo Browser</span>
              <span className="text-xs text-white/50">Version 1.0.0 (Custom Engine)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> AI Tab Groups
            </h3>
            
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-purple-300">Auto-Suggest Tab Groups</span>
                    <span className="text-xs text-white/50 mt-0.5">Show a suggestion banner when you have 4+ ungrouped tabs.</span>
                  </div>
                  <button 
                    onClick={() => aiStore.setAutoSuggestEnabled(!aiStore.autoSuggestEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${aiStore.autoSuggestEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${aiStore.autoSuggestEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="w-full h-px bg-purple-500/10" />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-purple-400" />
                  <span className="text-sm font-medium text-white">Gemini API Key (Optional)</span>
                </div>
                <span className="text-xs text-white/50">
                  By default, AI tab grouping uses a smart offline heuristic. Provide a free Gemini API key to upgrade to LLM-powered grouping with custom category names.
                </span>
                
                <div className="relative mt-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiStore.geminiApiKey}
                    onChange={e => aiStore.setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#1a1a1e]/80 border border-purple-500/30 rounded-lg pl-3 pr-10 py-2 text-sm text-white outline-none focus:border-purple-400/70 focus:bg-[#1a1a1e] transition-all placeholder:text-white/20"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                    Get a free API key &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
