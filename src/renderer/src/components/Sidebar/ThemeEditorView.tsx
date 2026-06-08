import React from 'react'
import { m as motion } from 'framer-motion'
import { Sparkles, Sun, Moon, Plus, Minus, Palette, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ThemeEditorViewProps {
  onClose: () => void
}

export const ThemeEditorView = ({ onClose }: ThemeEditorViewProps) => {
  const colors = [
    '#F5F5DC', // cream
    '#FFC0CB', // pink
    '#E6E6FA', // lavender
    '#F08080', // light coral
    '#FFA07A', // light salmon
    '#F0E68C', // khaki
    '#98FB98', // pale green
    '#B0C4DE'  // light steel blue
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-[#131313] z-[60] flex flex-col overflow-hidden"
    >
      {/* Top Header & Back Button */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Grid Background Area */}
      <div 
        className="flex-1 relative flex flex-col items-center justify-between py-12"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      >
        {/* Mode Selector */}
        <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/5">
          <button className="text-white bg-white/10 p-2 rounded-lg"><Sparkles size={18} /></button>
          <button className="text-white/40 hover:text-white/80 transition-colors"><Sun size={18} /></button>
          <button className="text-white/40 hover:text-white/80 transition-colors"><Moon size={18} /></button>
        </div>

        {/* Center Text */}
        <div className="text-[#a0a0a5] text-[13px] font-medium">
          Click to add a color
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 text-white/40">
          <button className="hover:text-white/80 transition-colors"><Plus size={18} /></button>
          <button className="hover:text-white/80 transition-colors"><Minus size={18} /></button>
          <button className="hover:text-white/80 transition-colors"><Palette size={18} /></button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-[#1a1a1e] rounded-t-3xl border-t border-white/5 p-6 flex flex-col gap-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        
        {/* Color Carousel */}
        <div className="flex items-center justify-between gap-2">
          <button className="text-white/30 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
          <div className="flex flex-1 justify-between px-2">
            {colors.map((color, i) => (
              <button 
                key={i} 
                className="w-6 h-6 rounded-full shadow-inner hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button className="text-white/30 hover:text-white transition-colors"><ChevronRight size={16} /></button>
        </div>

        {/* Sliders & Dial */}
        <div className="flex items-center gap-6 pb-2">
          {/* Wave Slider */}
          <div className="flex-1 relative h-12 flex items-center justify-center">
            {/* Base thick line */}
            <div className="absolute inset-x-0 h-4 bg-white/5 rounded-full" />
            
            {/* SVG Wave */}
            <svg viewBox="0 0 200 40" className="absolute inset-0 w-full h-full drop-shadow-md" preserveAspectRatio="none">
              <path 
                d="M 0 20 Q 12.5 0 25 20 T 50 20 T 75 20 T 100 20 T 125 20 T 150 20 T 175 20 T 200 20" 
                fill="none" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="4" 
                strokeLinecap="round"
                className="transition-all"
              />
            </svg>
          </div>

          {/* Rotary Dial */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            {/* Tick marks */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white/10 rounded-full"
                style={{
                  transform: `rotate(${i * 30}deg) translateY(-24px)`
                }}
              />
            ))}
            {/* Active tick */}
            <div 
              className="absolute w-1.5 h-3 bg-white/80 rounded-full"
              style={{
                transform: `rotate(0deg) translateY(-24px)`
              }}
            />
            {/* Dial body */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#2a2a2e] to-[#131313] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)] border border-black/50" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
