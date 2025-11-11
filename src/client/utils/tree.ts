export class TreeNode {
  key: string
  name: string
  children: TreeNode[]
  childrenMap: Map<string, TreeNode>

  constructor(name: string, key = name) {
    this.name = name
    this.key = key
    this.children = []
    this.childrenMap = new Map()
  }
}

export const keysToTree = (paths: string[]) => {
  const rootNode = new TreeNode('__root__')
  for (const path of paths) {
    const parts = path.split(':')

    let currentNode = rootNode
    let prefix = ''
    for (const part of parts) {
      let nextNode: TreeNode | null
      if (!currentNode.childrenMap.has(part)) {
        nextNode = new TreeNode(part, prefix + part)
        currentNode.childrenMap.set(part, nextNode)
        currentNode.children.push(nextNode)
      } else {
        nextNode = currentNode.childrenMap.get(part)!
      }
      prefix = prefix + part + ':'
      currentNode = nextNode
    }
  }
  return rootNode.children
}
