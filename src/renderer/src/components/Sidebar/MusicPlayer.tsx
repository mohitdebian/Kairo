import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrowserStore } from '../../store/useBrowserStore'
import { Play, Pause, SkipBack, SkipForward, Music2, Volume2, Heart } from 'lucide-react'
import { cn } from '../../utils/cn'

export const MusicPlayer = () => {
  const isSidebarCollapsed = useBrowserStore((state) => state.isSidebarCollapsed)
  const musicTabId = useBrowserStore((state) => state.musicTabId)
  const toggleMusicPlayer = useBrowserStore((state) => state.toggleMusicPlayer)
  const isMusicPlayerOpen = useBrowserStore((state) => state.isMusicPlayerOpen)
  const musicTrack = useBrowserStore((state) => state.musicTrack)
  const tabUrl = useBrowserStore((state) => state.tabs.find((t) => t.id === state.musicTabId)?.url)

  const isPlaying = musicTrack?.isPlaying || false
  const title = musicTrack?.title || 'Not Playing'
  const artist = musicTrack?.artist || 'Loading...'
  const artUrl =
    musicTrack?.artUrl ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200'

  const progress = musicTrack?.progress || 0
  const currentTimeText = (musicTrack as any)?.currentTimeText || '0:00'
  const durationText = (musicTrack as any)?.durationText || '0:00'

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!musicTabId) return
    const wv = document.getElementById(`webview-${musicTabId}`) as any
    if (!wv) return
    const isYoutube = tabUrl?.includes('youtube.com')
    const code = isYoutube
      ? `document.querySelector('video')?.paused ? document.querySelector('video')?.play() : document.querySelector('video')?.pause()`
      : `document.querySelector('[data-testid="control-button-playpause"]')?.click()`
    wv.executeJavaScript(code)
  }

  const handleSkipForward = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!musicTabId) return
    const wv = document.getElementById(`webview-${musicTabId}`) as any
    if (!wv) return
    const code = tabUrl?.includes('youtube.com')
      ? `document.querySelector('.next-button')?.click()`
      : `document.querySelector('[data-testid="control-button-skip-forward"]')?.click()`
    wv.executeJavaScript(code)
  }

  const handleSkipBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!musicTabId) return
    const wv = document.getElementById(`webview-${musicTabId}`) as any
    if (!wv) return
    const code = tabUrl?.includes('youtube.com')
      ? `document.querySelector('.previous-button')?.click()`
      : `document.querySelector('[data-testid="control-button-skip-back"]')?.click()`
    wv.executeJavaScript(code)
  }

  // Ref for the mini player to anchor the popover
  const miniPlayerRef = useRef<HTMLDivElement>(null)
  const [popoverCoords, setPopoverCoords] = useState({ x: 0, y: 0 })

  const updatePopoverCoords = () => {
    if (miniPlayerRef.current) {
      const rect = miniPlayerRef.current.getBoundingClientRect()
      // Anchor to the right of the mini player
      setPopoverCoords({ x: rect.right + 16, y: rect.top })
    }
  }

  useEffect(() => {
    if (isMusicPlayerOpen) {
      updatePopoverCoords()
      window.addEventListener('resize', updatePopoverCoords)
      return () => window.removeEventListener('resize', updatePopoverCoords)
    }
    return undefined
  }, [isMusicPlayerOpen])

  // Click outside handler for popover
  useEffect(() => {
    if (!isMusicPlayerOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.music-popover') && !target.closest('.music-trigger')) {
        toggleMusicPlayer()
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [isMusicPlayerOpen])

  // ----------------------------------------
  // HIDE WHEN NO MUSIC TAB ACTIVE
  // ----------------------------------------
  if (!musicTabId) {
    return null
  }

  // ----------------------------------------
  // EXPANDED FLOATING POPOVER
  // ----------------------------------------
  const renderFloatingPopover = () => {
    if (!isMusicPlayerOpen || typeof document === 'undefined') return null
    return ReactDOM.createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ left: popoverCoords.x, top: popoverCoords.y }}
          className="fixed z-[9999] w-64 p-4 rounded-2xl bg-[#1a1a1e]/95 backdrop-blur-3xl border border-white/10 premium-shadow music-popover"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              Now Playing
            </span>
          </div>

          {/* Info & Compact Art */}
          <div className="flex items-center gap-3 mb-5 mt-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
              <img src={artUrl} alt="Album Art" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden text-left">
              <span className="text-[14px] font-bold text-white truncate leading-tight">
                {title}
              </span>
              <span className="text-[11px] text-white/60 truncate">{artist}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="w-full flex items-center gap-2 mb-4">
            <span className="text-[10px] text-text-secondary font-mono">{currentTimeText}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative">
              <div
                className="absolute top-0 left-0 h-full bg-white transition-all duration-300 rounded-full group-hover:bg-[var(--color-accent)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-text-secondary font-mono">{durationText}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <button className="text-white/40 hover:text-white transition-colors">
              <Heart size={16} />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSkipBack}
                className="text-white/80 hover:text-white transition-colors"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button
                onClick={handleSkipForward}
                className="text-white/80 hover:text-white transition-colors"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            <button className="text-white/40 hover:text-white transition-colors">
              <Volume2 size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    )
  }

  // ----------------------------------------
  // COLLAPSED SIDEBAR (64px)
  // ----------------------------------------
  if (isSidebarCollapsed) {
    return (
      <div className="w-full flex justify-center py-2 relative group shrink-0" ref={miniPlayerRef}>
        <button
          onClick={toggleMusicPlayer}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-colors no-drag music-trigger',
            isPlaying
              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
              : 'hover:bg-white/10 text-text-secondary'
          )}
        >
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3">
              <motion.div
                animate={{ height: [4, 12, 4] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-[3px] bg-current rounded-full"
              />
              <motion.div
                animate={{ height: [8, 4, 8] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="w-[3px] bg-current rounded-full"
              />
              <motion.div
                animate={{ height: [6, 10, 6] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="w-[3px] bg-current rounded-full"
              />
            </div>
          ) : (
            <Music2 size={16} />
          )}
        </button>
        {renderFloatingPopover()}
      </div>
    )
  }

  // ----------------------------------------
  // EXPANDED SIDEBAR COMPACT PLAYER (280px)
  // ----------------------------------------
  return (
    <div className="mx-3 mb-4 shrink-0">
      <motion.div
        layout
        className={cn(
          'rounded-2xl bg-white/[0.03] border border-white/[0.05] flex flex-col overflow-hidden transition-colors cursor-pointer group music-trigger relative',
          isMusicPlayerOpen
            ? 'bg-white/[0.05] border-white/[0.1] shadow-lg p-4'
            : 'hover:bg-white/[0.04] p-2 h-[70px]'
        )}
        onClick={() => {
          if (!isMusicPlayerOpen) toggleMusicPlayer()
        }}
      >
        {isMusicPlayerOpen ? (
          // LARGE SQUARE WIDGET INLINE
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                Now Playing
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMusicPlayer()
                }}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 15l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Info & Compact Art */}
            <div className="flex items-center gap-3 mb-5 mt-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
                <img src={artUrl} alt="Album Art" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden text-left">
                <span className="text-[14px] font-bold text-white truncate leading-tight">
                  {title}
                </span>
                <span className="text-[11px] text-white/60 truncate">{artist}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full flex items-center gap-2 mb-4">
              <span className="text-[10px] text-text-secondary font-mono">{currentTimeText}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative">
                <div
                  className="absolute top-0 left-0 h-full bg-white transition-all duration-300 rounded-full group-hover:bg-[var(--color-accent)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-text-secondary font-mono">{durationText}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-2">
              <button className="text-white/40 hover:text-white transition-colors">
                <Heart size={16} />
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSkipBack}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" className="ml-1" />
                  )}
                </button>
                <button
                  onClick={handleSkipForward}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>
              <button className="text-white/40 hover:text-white transition-colors">
                <Volume2 size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          // COMPACT WIDGET (70px)
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 w-full h-full relative"
          >
            <div className="w-[52px] h-[52px] rounded-xl overflow-hidden shrink-0 shadow-md relative">
              <img
                src={artUrl}
                alt="Album Art"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3">
                    <motion.div
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-[3px] bg-white rounded-full"
                    />
                    <motion.div
                      animate={{ height: [8, 4, 8] }}
                      transition={{ repeat: Infinity, duration: 0.9 }}
                      className="w-[3px] bg-white rounded-full"
                    />
                    <motion.div
                      animate={{ height: [6, 10, 6] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="w-[3px] bg-white rounded-full"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-[13px] font-semibold text-white truncate leading-tight">
                {title}
              </span>
              <span className="text-[11px] text-white/50 truncate">{artist}</span>
            </div>

            <div className="flex items-center gap-1.5 pr-1" onClick={(e) => e.stopPropagation()}>
              <button
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                onClick={handleSkipBack}
              >
                <SkipBack size={14} fill="currentColor" />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause size={12} fill="currentColor" />
                ) : (
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                onClick={handleSkipForward}
              >
                <SkipForward size={14} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
