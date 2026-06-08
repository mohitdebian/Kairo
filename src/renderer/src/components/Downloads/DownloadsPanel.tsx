import React from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { Download, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { useBrowserStore } from '../../store/useBrowserStore'

export const DownloadsPanel = () => {
  const { isDownloadsOpen, downloads, toggleDownloads, clearCompletedDownloads } = useBrowserStore()

  React.useEffect(() => {
    const handleBlur = () => {
      if (useBrowserStore.getState().isDownloadsOpen) {
        useBrowserStore.getState().toggleDownloads()
      }
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <AnimatePresence>
      {isDownloadsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={toggleDownloads} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 left-2 right-2 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
        style={{ maxHeight: '400px' }}
      >
        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Download size={14} className="text-white/70" />
            <h3 className="text-sm font-medium text-white">Downloads</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearCompletedDownloads}
              className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
              title="Clear completed"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={toggleDownloads}
              className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
            >
              <XCircle size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-2 flex flex-col gap-2 no-scrollbar">
          {downloads.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs">No recent downloads</div>
          ) : (
            downloads.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-medium truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <p className="text-[10px] text-white/50 truncate mt-0.5">{item.url}</p>
                  </div>
                  {item.state === 'completed' && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                  {item.state === 'cancelled' && <XCircle size={16} className="text-red-400 shrink-0" />}
                  {item.state === 'interrupted' && <AlertCircle size={16} className="text-yellow-400 shrink-0" />}
                </div>

                {item.state === 'progressing' && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-200"
                        style={{
                          width: `${item.totalBytes > 0 ? (item.receivedBytes / item.totalBytes) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>{formatBytes(item.receivedBytes)} / {item.totalBytes ? formatBytes(item.totalBytes) : 'Unknown'}</span>
                      <span>
                        {item.totalBytes > 0
                          ? Math.round((item.receivedBytes / item.totalBytes) * 100) + '%'
                          : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
