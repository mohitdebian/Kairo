import React, { useState } from 'react'
import { m as motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'
import { cn } from '../../utils/cn'

interface CreateSpaceViewProps {
  onClose: () => void
  onEditTheme: () => void
}

export const CreateSpaceView = ({ onClose, onEditTheme }: CreateSpaceViewProps) => {
  const [spaceName, setSpaceName] = useState('')

  const handleCreate = () => {
    if (!spaceName.trim()) return
    useBrowserStore.getState().addWorkspace({
      name: spaceName.trim(),
      icon: 'Code',
      color: '#8b5cf6'
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-[#131313] z-[60] flex flex-col p-4 overflow-y-auto no-scrollbar"
    >
      <div className="flex flex-col items-center mt-12 mb-8 text-center px-2">
        <h2 className="text-white font-semibold text-lg mb-2">Create a Space</h2>
        <p className="text-[#a0a0a5] text-[13px] leading-relaxed">
          Spaces are used to organize your tabs and sessions.
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Space Name Input */}
        <div className="flex items-center bg-[#1a1a1e] border border-white/5 rounded-xl px-2 py-2">
          <div className="w-8 h-8 rounded-lg border border-dashed border-white/20 flex items-center justify-center bg-white/5 shrink-0 mr-3">
            {/* Placeholder for icon picker */}
          </div>
          <input
            type="text"
            value={spaceName}
            onChange={(e) => setSpaceName(e.target.value)}
            placeholder="Space Name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="bg-transparent border-none outline-none text-white text-[14px] w-full placeholder:text-white/30"
          />
        </div>

        {/* Profile Selector */}
        <div className="flex items-center justify-between bg-[#1a1a1e] border border-white/5 rounded-xl px-4 py-3">
          <span className="text-[#a0a0a5] text-[13px]">Profile</span>
          <button className="bg-white/10 hover:bg-white/15 text-white text-[12px] px-3 py-1.5 rounded-lg transition-colors">
            Default
          </button>
        </div>

        {/* Edit Theme Button */}
        <button 
          onClick={onEditTheme}
          className="w-full bg-[#1a1a1e] hover:bg-[#202025] border border-white/5 rounded-xl py-3 text-white text-[13px] transition-colors"
        >
          Edit Theme
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-auto pt-6 pb-4">
        <button
          onClick={handleCreate}
          disabled={!spaceName.trim()}
          className={cn(
            "w-full py-3 rounded-xl text-[14px] font-medium transition-all",
            spaceName.trim()
              ? "bg-[var(--color-accent)] hover:brightness-110 text-white"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          Create Space
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-[14px] text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}
