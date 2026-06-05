import React, { useRef } from 'react'
import { SplitNode } from '../../store/useBrowserStore'
import { useBrowserStore } from '../../store/useBrowserStore'
import { cn } from '../../utils/cn'

interface SplitLayoutTreeProps {
  node: SplitNode
}

// Recursively calculates positions for all leaves and splitters
function calculateLayout(
  node: SplitNode,
  pos: { top: number; right: number; bottom: number; left: number }
): {
  leaves: Array<{ node: SplitNode; inset: string }>
  splitters: Array<{
    parentId: string
    index: number
    isHorizontal: boolean
    sizes: number[]
    inset: string
  }>
} {
  if (node.type === 'tab') {
    return {
      leaves: [
        { node, inset: `${pos.top}% ${100 - pos.right}% ${100 - pos.bottom}% ${pos.left}%` }
      ],
      splitters: []
    }
  }

  if (node.type === 'split' && node.children) {
    const isHorizontal = node.direction === 'horizontal'
    const sizes = node.sizes || node.children.map(() => 100 / node.children!.length)

    const leaves: Array<{ node: SplitNode; inset: string }> = []
    const splitters: Array<{
      parentId: string
      index: number
      isHorizontal: boolean
      sizes: number[]
      inset: string
    }> = []

    let currentPos = isHorizontal ? pos.left : pos.top
    const totalAvailable = isHorizontal ? pos.right - pos.left : pos.bottom - pos.top

    node.children.forEach((child, index) => {
      const sizePercent = (sizes[index] / 100) * totalAvailable

      const childPos = { ...pos }
      if (isHorizontal) {
        childPos.left = currentPos
        childPos.right = currentPos + sizePercent
      } else {
        childPos.top = currentPos
        childPos.bottom = currentPos + sizePercent
      }

      const childLayout = calculateLayout(child, childPos)
      leaves.push(...childLayout.leaves)
      splitters.push(...childLayout.splitters)

      currentPos += sizePercent

      // Add splitter (except for last child)
      if (index < node.children!.length - 1) {
        const splitterInset = isHorizontal
          ? `${pos.top}% ${100 - currentPos}% ${100 - pos.bottom}% ${currentPos}%`
          : `${currentPos}% ${100 - pos.right}% ${100 - currentPos}% ${pos.left}%`

        splitters.push({
          parentId: node.id,
          index,
          isHorizontal,
          sizes: [...sizes],
          inset: splitterInset
        })
      }
    })

    return { leaves, splitters }
  }

  return { leaves: [], splitters: [] }
}

const DropZone = ({
  side,
  nodeId
}: {
  side: 'center' | 'top' | 'right' | 'bottom' | 'left'
  nodeId: string
}) => {
  const isDraggingTab = useBrowserStore((state) => state.isDraggingTab)

  if (!isDraggingTab) return null

  return (
    <div
      data-dnd-type="split-leaf"
      data-dnd-id={nodeId}
      data-dnd-side={side}
      className={cn(
        'absolute z-[100] transition-colors duration-200 pointer-events-auto',
        side === 'center' && 'inset-[15%] rounded-2xl',
        side === 'top' && 'top-0 left-0 right-0 h-[15%]',
        side === 'bottom' && 'bottom-0 left-0 right-0 h-[15%]',
        side === 'left' && 'top-0 left-0 bottom-0 w-[15%]',
        side === 'right' && 'top-0 right-0 bottom-0 w-[15%]',
        'hover:bg-[var(--color-accent)]/20 hover:backdrop-blur-[2px]'
      )}
    />
  )
}

export const SplitLayoutTree: React.FC<SplitLayoutTreeProps> = ({ node }) => {
  const { leaves, splitters } = calculateLayout(node, { top: 0, right: 100, bottom: 100, left: 0 })

  return (
    <div className="w-full h-full relative overflow-hidden">
      {leaves.map(({ node: leaf, inset }) => (
        <div
          key={leaf.id}
          id={`split-leaf-${leaf.tabId}`}
          className="absolute group/pane pointer-events-auto"
          style={{ inset }}
        >
          {/* Drop Zones for rearranging or dropping into split */}
          <DropZone side="center" nodeId={leaf.id} />
          <DropZone side="top" nodeId={leaf.id} />
          <DropZone side="right" nodeId={leaf.id} />
          <DropZone side="bottom" nodeId={leaf.id} />
          <DropZone side="left" nodeId={leaf.id} />

          {/* We rely on BrowserView logic in AppLayout to render the actual Tab contents here.
              The DOM node just acts as a container to measure bounds.
          */}
          <div className="w-full h-full" />
        </div>
      ))}

      {splitters.map((splitter, i) => (
        <SplitDivider key={`${splitter.parentId}-${splitter.index}-${i}`} {...splitter} />
      ))}
    </div>
  )
}

interface SplitDividerProps {
  parentId: string
  index: number
  isHorizontal: boolean
  sizes: number[]
  inset: string
}

const SplitDivider: React.FC<SplitDividerProps> = ({
  parentId,
  index,
  isHorizontal,
  sizes,
  inset
}) => {
  const resizePane = useBrowserStore((state) => state.resizePane)
  const isDragging = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isDragging.current = true
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'

    const startPos = isHorizontal ? e.clientX : e.clientY
    const startSizes = [...sizes]

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDragging.current) return

      const delta = isHorizontal ? moveEvent.clientX - startPos : moveEvent.clientY - startPos
      const parentEl = target.closest('.relative.overflow-hidden') as HTMLElement
      const totalSize = parentEl
        ? isHorizontal
          ? parentEl.clientWidth
          : parentEl.clientHeight
        : 1000

      const deltaPercent = (delta / totalSize) * 100

      const newSizes = [...startSizes]
      newSizes[index] = Math.max(5, startSizes[index] + deltaPercent)
      newSizes[index + 1] = Math.max(5, startSizes[index + 1] - deltaPercent)

      const diff =
        newSizes[index] + newSizes[index + 1] - (startSizes[index] + startSizes[index + 1])
      if (Math.abs(diff) > 0.1) {
        newSizes[index + 1] -= diff
      }

      resizePane(parentId, newSizes)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      isDragging.current = false
      document.body.style.cursor = 'default'
      target.releasePointerCapture(upEvent.pointerId)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerUp)
    }

    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div
      className={cn(
        'absolute z-50 flex items-center justify-center',
        isHorizontal ? 'w-2 cursor-col-resize -ml-1' : 'h-2 cursor-row-resize -mt-1'
      )}
      style={{
        top: inset.split(' ')[0],
        right: inset.split(' ')[1],
        bottom: inset.split(' ')[2],
        left: inset.split(' ')[3]
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className={cn(
          'absolute bg-white/10 transition-all hover:bg-[var(--color-accent)]/50 rounded-full',
          isHorizontal ? 'w-[3px] h-full' : 'h-[3px] w-full'
        )}
      />
    </div>
  )
}
