import { ChevronRightIcon, FolderIcon, FolderOpenIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Box } from '@/client/components/ui/Box'
import { TreeNode } from '@/client/utils/tree'
import { useRedisStore } from '@/client/stores/redisStore'
import { RedisTypeTag } from '../RedisTypeTag'
import s from './index.module.scss'

interface RedisKeysTreeProps {
  nodes: TreeNode[]
  deep?: number
  onSelect?: (key: string, node: TreeNode) => void
}

export const RedisKeysTree: React.FC<RedisKeysTreeProps> = ({
  nodes,
  ...restProps
}) => {
  return nodes.map((node) => {
    return <RedisKeysTreeNode key={node.key} node={node} {...restProps} />
  })
}

interface KeysTreeNodeProps {
  node: TreeNode
  deep?: number
  onSelect?: (key: string, node: TreeNode) => void
}

export const RedisKeysTreeNode: React.FC<KeysTreeNodeProps> = ({
  node,
  deep = 0,
  onSelect,
}) => {
  const keysState = useRedisStore((state) => state.keysState)
  const [open, setOpen] = useState(false)
  const hasChildren = Boolean(node.children && node.children.length)
  const isLeaf = !hasChildren

  const type = useMemo(
    () =>
      isLeaf
        ? keysState.data.find((d) => d.key === node.key)?.type || 'UNSET'
        : 'UNSET',
    [isLeaf, node, keysState]
  )

  return (
    <>
      {isLeaf ? (
        <Box
          key={node.key}
          className={s.KeysTreeNode}
          onClick={() => onSelect?.(node.key, node)}
          data-deep={deep}
          data-open={open}
          paddingLeft={`${deep * 1}rem`}
        >
          <Box width="5rem">
            <RedisTypeTag type={type} />
          </Box>
          {node.key}
        </Box>
      ) : (
        <Box
          key={node.key}
          className={s.KeysTreeNode}
          onClick={() => {
            setOpen((pre) => !pre)
          }}
          data-deep={deep}
          data-open={open}
          paddingLeft={`${deep * 1}rem`}
        >
          <ChevronRightIcon data-type="arrow" className={s.KeysTreeNodeIcon} />
          {open ? (
            <FolderOpenIcon data-type="folder" className={s.KeysTreeNodeIcon} />
          ) : (
            <FolderIcon data-type="folder" className={s.KeysTreeNodeIcon} />
          )}
          {node.name}
        </Box>
      )}

      {open && hasChildren && (
        <RedisKeysTree
          nodes={node.children}
          deep={deep + 1}
          onSelect={onSelect}
        />
      )}
    </>
  )
}
