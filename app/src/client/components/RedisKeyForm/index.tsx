import { useState } from 'react'
import { toast } from 'sonner'
import { Editor } from '@/client/components/Editor'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { Input } from '@/client/components/ui/Input'
import { Select } from '@/client/components/ui/Select'
import { NumberInputWithPrefix } from '@/client/components/ui/NumberInput'
import { useRedisId } from '@/client/hooks/useRedisId'
import { redisKeyTypes } from '@/constants/redisKeyTypes'
import {
  setHASHData,
  setLISTData,
  setSETData,
  setSTRINGData,
  setZSETData,
} from '@/client/commands/redis'
import { setSTREAMData } from '@/client/commands/redis/STREAM'
import { queryRedisKeys } from '@/client/stores/redisStore'

const defaultValues = {
  type: 'STRING',
  key: '',
  ttl: -1,
  value: '',
}

export const RedisKeyCreateForm = () => {
  const redisId = useRedisId()
  const [values, setValues] = useState({ ...defaultValues })
  const onChange = (newValue: Partial<typeof values>) => {
    setValues((pre) => ({
      ...pre,
      ...newValue,
    }))
  }

  const onSubmit = () => {
    if (!values.key) return toast.error('Invalid Key')

    toast.promise(
      async () => {
        switch (values.type) {
          case 'STRING':
            setSTRINGData(redisId, values.key, values.value, values.ttl)
            break
          case 'HASH':
            setHASHData(redisId, values.key, [
              {
                field: 'New Field',
                value: 'New Value',
              },
            ])
            break
          case 'SET':
            setSETData(redisId, values.key, [
              {
                member: 'New Value',
              },
            ])
            break
          case 'ZSET':
            setZSETData(redisId, values.key, [
              { score: 0, member: 'New Member' },
            ])
            break
          case 'LIST':
            setLISTData(redisId, values.key, [
              { index: 0, element: 'New Value' },
            ])
            break
          case 'STREAM':
            setSTREAMData(redisId, values.key, {
              value: JSON.stringify({ key: 'New Key', value: 'New Value' }),
            })
            break
          default:
            break
        }
      },
      {
        loading: 'Loading...',
        success: () => {
          queryRedisKeys(redisId)
          return 'Create Key Successfully'
        },
        error: (e) => e?.message || 'Create Key Failed',
        finally() {
          setValues({ ...defaultValues })
        },
      }
    )
  }
  return (
    <Box as="form" display="flex" flexDirection="column">
      <Box
        position="sticky"
        top={0}
        zIndex={1}
        borderBottom="1px solid var(--border-color)"
        backgroundColor="var(--background-color)"
      >
        <Box
          display="flex"
          alignItems="center"
          gap="var(--spacing-md)"
          padding="var(--spacing-md)"
        >
          <Box flex={1}>
            <Select
              value={values.type}
              options={redisKeyTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              onChange={(e) => {
                onChange({ type: e })
              }}
            />
          </Box>
          <Box flex={1}>
            <Input
              value={values.key}
              onChange={(e) => {
                onChange({ key: e.target.value.trim() })
              }}
              placeholder="Key Name"
            />
          </Box>
        </Box>

        <Box padding="var(--spacing-md)" paddingTop={0}>
          <NumberInputWithPrefix
            prefixNode="TTL"
            min={-1}
            value={values.ttl.toString()}
            onChange={(e) => {
              onChange({ ttl: Number(e) })
            }}
          />
        </Box>
      </Box>

      <Box padding="var(--spacing-md)">
        {values.type === 'STRING' ? (
          <Editor
            value={values.value}
            onChange={(e) => {
              onChange({ value: e })
            }}
          />
        ) : (
          <Box
            height="200px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            The Value Must Be Set After the Key Is Created
          </Box>
        )}
      </Box>

      <Box
        position="sticky"
        bottom={0}
        zIndex={1}
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        padding="var(--spacing-md)"
        borderTop="1px solid var(--border-color)"
        backgroundColor="var(--background-color)"
      >
        <Button type="button" onClick={onSubmit}>
          Create
        </Button>
      </Box>
    </Box>
  )
}
