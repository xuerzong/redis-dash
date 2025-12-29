import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  TrashIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Box } from '@client/components/ui/Box'
import { TreeNode } from '@client/utils/tree'
import {
  ContextMenu,
  type ContextMenuItemProps,
} from '@client/components/ui/ContextMenu'
import { RedisTypeTag } from '../RedisTypeTag'
import { RedisKeyDeleteModal } from '../RedisKeyDeleteModal'
import s from './index.module.scss'
import { useRedisKeysContext } from '@client/providers/RedisKeysContext'
import { useIntlContext } from '@client/providers/IntlProvider'

interface RedisKeysTreeProps {
  nodes: TreeNode[]
  deep?: number
  onSelect?: (key: string, node: TreeNode) => void
}

export const RedisKeysTree: React.FC<RedisKeysTreeProps> = ({
  nodes,
  ...restProps
}) => {
  return (
    <>
      {nodes.map((node) => (
        <RedisKeysTreeNode key={node.key} node={node} {...restProps} />
      ))}
    </>
  )
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
  const { keys } = useRedisKeysContext()
  const [open, setOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [hasSelected, setHasSelected] = useState(false)
  const hasChildren = Boolean(node.children && node.children.length)
  const isLeaf = !hasChildren
  const { formatMessage } = useIntlContext()

  const type = useMemo(
    () =>
      isLeaf ? keys.find((d) => d.key === node.key)?.type || 'UNSET' : 'UNSET',
    [isLeaf, node, keys]
  )

  const contextMenu = useMemo<ContextMenuItemProps[]>(() => {
    return [
      {
        key: 'delete',
        label: formatMessage('delete'),
        icon: <TrashIcon />,
        colorPalette: 'danger',
        onClick() {
          setDelOpen(true)
        },
      },
    ]
  }, [formatMessage])

  return (
    <>
      {isLeaf ? (
        <ContextMenu
          menu={contextMenu}
          key={node.key}
          onOpenChange={setHasSelected}
        >
          <Box
            key={node.key}
            className={s.KeysTreeNode}
            onClick={() => onSelect?.(node.key, node)}
            data-deep={deep}
            data-open={open}
            data-selected={hasSelected}
            paddingLeft={`${deep * 1 + 1}rem`}
          >
            <Box width="5rem">
              <RedisTypeTag type={type} />
            </Box>
            {node.key}
          </Box>

          <RedisKeyDeleteModal
            open={delOpen}
            onOpenChange={setDelOpen}
            keyName={node.key}
          />
        </ContextMenu>
      ) : (
        <Box
          key={node.key}
          className={s.KeysTreeNode}
          onClick={() => {
            setOpen((pre) => !pre)
          }}
          data-deep={deep}
          data-open={open}
          paddingLeft={`${deep * 1 + 1}rem`}
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
