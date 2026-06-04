import { SplitNode, SplitDirection } from './useBrowserStore'

export const createLeaf = (tabId: string): SplitNode => ({
  id: `leaf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'tab',
  tabId
})

export const createSplit = (direction: SplitDirection, children: SplitNode[], sizes: number[] = [50, 50]): SplitNode => ({
  id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'split',
  direction,
  children,
  sizes
})

// Recursively find a node by ID
export const findNode = (root: SplitNode, id: string): SplitNode | undefined => {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return undefined
}

// Recursively find a node by tab ID
export const findNodeByTabId = (root: SplitNode, tabId: string): SplitNode | undefined => {
  if (root.type === 'tab' && root.tabId === tabId) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByTabId(child, tabId)
      if (found) return found
    }
  }
  return undefined
}

// Find parent of a node
export const findParent = (root: SplitNode, childId: string): SplitNode | undefined => {
  if (!root.children) return undefined
  if (root.children.some(c => c.id === childId)) return root
  for (const child of root.children) {
    const parent = findParent(child, childId)
    if (parent) return parent
  }
  return undefined
}

// Split a leaf node into a split node containing the original leaf and a new leaf
export const splitLeafNode = (root: SplitNode, targetLeafId: string, direction: SplitDirection, newTabId: string, insertBefore: boolean = false): SplitNode => {
  if (root.id === targetLeafId && root.type === 'tab') {
    const originalNode = { ...root }
    const newNode = createLeaf(newTabId)
    return createSplit(direction, insertBefore ? [newNode, originalNode] : [originalNode, newNode])
  }
  
  if (root.children) {
    return {
      ...root,
      children: root.children.map(child => splitLeafNode(child, targetLeafId, direction, newTabId, insertBefore))
    }
  }
  
  return root
}

// Remove a node and collapse unnecessary splits
export const removeNode = (root: SplitNode, targetId: string): SplitNode | null => {
  if (root.id === targetId) return null
  
  if (root.children) {
    const newChildren = root.children
      .map(child => removeNode(child, targetId))
      .filter((c): c is SplitNode => c !== null)
      
    if (newChildren.length === 0) return null
    if (newChildren.length === 1) return newChildren[0] // Collapse split
    
    // If a child was removed, adjust sizes to maintain sum
    let newSizes = root.sizes || [50, 50]
    if (newChildren.length < root.children.length) {
      newSizes = newChildren.map(() => 100 / newChildren.length)
    }
    
    return {
      ...root,
      children: newChildren,
      sizes: newSizes
    }
  }
  
  return root
}

// Get all tab IDs in a tree
export const getAllTabIds = (root: SplitNode): string[] => {
  if (root.type === 'tab' && root.tabId) return [root.tabId]
  if (root.children) {
    return root.children.flatMap(getAllTabIds)
  }
  return []
}

// Replace a tab in a specific leaf
export const replaceTabInLeaf = (root: SplitNode, leafId: string, newTabId: string): SplitNode => {
  if (root.id === leafId && root.type === 'tab') {
    return { ...root, tabId: newTabId }
  }
  if (root.children) {
    return {
      ...root,
      children: root.children.map(c => replaceTabInLeaf(c, leafId, newTabId))
    }
  }
  return root
}
