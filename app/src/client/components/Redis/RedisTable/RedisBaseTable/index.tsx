import { toast } from 'sonner'
import { Box } from '@/client/components/ui/Box'
import { Table, type TableColumn } from '@/client/components/ui/Table'
import { Button, IconButton } from '@/client/components/ui/Button'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/client/components/ui/Input'
import { Drawer } from '@/client/components/ui/Drawer'
import { FormField } from '@/client/components/ui/Form'
import { Editor } from '@/client/components/Editor'
import { Modal } from '@/client/components/ui/Modal'
import s from './index.module.scss'

interface RedisTableField {
  type: 'input' | 'editor'
  name: string
  label: string
}

export interface RedisBaseTableProps {
  rowKey?: (row: any) => string
  columns: TableColumn<any>[]
  dataSource?: any[]
  length?: number
  fields?: RedisTableField[]
  onRowAdd?: (values: any) => Promise<void>
  onRowEdit?: (values: any, lastValues: any) => Promise<void>
  onRowDel?: (values: any) => Promise<void>
  defaultFormValues?: Record<string, any>
  onPageChange?: (page: { pageNo: number; pageSize: number }) => void
}

export const RedisBaseTable: React.FC<RedisBaseTableProps> = ({
  columns,
  dataSource = [],
  length = 0,
  rowKey,
  fields,
  onRowAdd,
  onRowEdit,
  onRowDel,
  defaultFormValues = {},
  onPageChange,
}) => {
  const [pageNo, setPageNo] = useState(1)
  const [pageSize] = useState(100)
  const totalPage = Math.max(Math.ceil(length / 100), 1)
  const [formMode, setFormMode] = useState(0)
  const [formDefaultValues, setFormDefaultValues] =
    useState<any>(defaultFormValues)
  const [formValues, setFormValues] = useState<any>(defaultFormValues)
  const [addOpen, setAddOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [delLoading, setDelLoading] = useState(false)

  useEffect(() => {
    if (!addOpen) {
      setFormValues(defaultFormValues)
      setFormMode(0)
    }
  }, [addOpen])

  useEffect(() => {
    if (!delOpen) {
      setFormValues(defaultFormValues)
    }
  }, [delOpen])

  const onChangeTableProps = (newTableProps: Partial<{ pageNo: number }>) => {
    if ('pageNo' in newTableProps && newTableProps.pageNo !== pageNo) {
      setPageNo(newTableProps.pageNo!)
      onPageChange?.({ pageNo: newTableProps.pageNo!, pageSize })
    }
  }

  const operationColumn: TableColumn<any> = useMemo(
    () => ({
      key: 'operation',
      label: 'Operation',
      width: '6rem',
      render(_, record) {
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap="0.25rem"
          >
            {onRowEdit && (
              <IconButton
                variant="ghost"
                onClick={() => {
                  setFormMode(1)
                  setAddOpen(true)
                  setFormDefaultValues(record || defaultFormValues)
                  setFormValues(record || defaultFormValues)
                }}
              >
                <PencilIcon />
              </IconButton>
            )}
            {onRowDel && (
              <IconButton
                variant="ghost"
                onClick={() => {
                  setFormValues(record || defaultFormValues)
                  setDelOpen(true)
                }}
              >
                <TrashIcon />
              </IconButton>
            )}
          </Box>
        )
      },
    }),
    [onRowDel, onRowEdit]
  )

  const tableColumns = useMemo(() => {
    return [...columns, operationColumn]
  }, [operationColumn, columns])

  const onFieldChange = (key: string, value: any) => {
    setFormValues((pre: any) => ({ ...pre, [key]: value }))
  }

  return (
    <Box display="flex" flexDirection="column" gap="var(--spacing-md)">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="flex-start"
        gap="0.5rem"
      >
        <Box className={s.SearchInput}>
          <SearchIcon className={s.SearchInputIcon} />
          <Input placeholder="Search" />
        </Box>

        <Box flexShrink={0} display="flex" alignItems="center">
          <IconButton
            variant="outline"
            onClick={() => {
              onChangeTableProps({ pageNo: Math.max(1, pageNo - 1) })
            }}
            disabled={pageNo === 1}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Box
            flexShrink={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="0.75rem"
            padding="0 0.5rem"
          >
            {pageNo} / {totalPage}
          </Box>
          <IconButton
            variant="outline"
            onClick={() => {
              onChangeTableProps({ pageNo: Math.min(totalPage, pageNo + 1) })
            }}
            disabled={pageNo === totalPage}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <IconButton
          variant="outline"
          onClick={() => {
            setAddOpen(true)
          }}
        >
          <PlusIcon />
        </IconButton>
      </Box>
      {dataSource && dataSource.length ? (
        <Table rowKey={rowKey} columns={tableColumns} data={dataSource} />
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="200px"
          gap="var(--spacing-md)"
        >
          <Box>No Data</Box>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            Add New
          </Button>
        </Box>
      )}

      <Drawer
        title={formMode === 0 ? `Add Row` : 'Edit Row'}
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <Box display="flex" flexDirection="column" gap="var(--spacing-md)">
          {fields?.map((field) => (
            <FormField key={field.name} name={field.name} label={field.label}>
              {field.type === 'input' && (
                <Input
                  value={formValues[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                />
              )}
              {field.type === 'editor' && (
                <Editor
                  value={formValues[field.name] || ''}
                  onChange={(e) => {
                    onFieldChange(field.name, e)
                  }}
                />
              )}
            </FormField>
          ))}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap="0.5rem"
          >
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (onRowAdd && formMode === 0) {
                  toast.promise(onRowAdd(formValues), {
                    loading: 'Loading',
                    success: () => {
                      setAddOpen(false)
                      return 'Add Row Successfully'
                    },
                    error: (e) => {
                      console.error(e)
                      return e.message || 'Add Row Failed'
                    },
                  })
                }

                if (onRowEdit && formMode === 1) {
                  toast.promise(onRowEdit(formValues, formDefaultValues), {
                    loading: 'Loading',
                    success: () => {
                      setAddOpen(false)
                      return 'Update Row Successfully'
                    },
                    error: (e) => {
                      console.error(e)
                      return e.message || 'Update Row Failed'
                    },
                  })
                }
              }}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Modal
        title="Delete Row"
        description="Confirm delete this row?"
        open={delOpen}
        onOpenChange={setDelOpen}
        footer={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap="var(--spacing-md)"
            padding="1rem"
          >
            <Button
              variant="outline"
              onClick={() => {
                setDelOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (onRowDel) {
                  setDelLoading(true)
                  toast.promise(onRowDel(formValues), {
                    loading: 'Loading...',
                    success: () => {
                      setDelOpen(false)
                      return 'Delete Row Successfully'
                    },
                    error(e) {
                      return e.message || 'Delete Row Failed'
                    },
                    finally() {
                      setDelLoading(false)
                    },
                  })
                }
              }}
              loading={delLoading}
            >
              Confirm
            </Button>
          </Box>
        }
      ></Modal>
    </Box>
  )
}
