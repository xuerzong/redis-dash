import { useState } from 'react'
import z from 'zod'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { Input } from '@/client/components/ui/Input'
import { FormField } from '@/client/components/ui/Form'
import { queryConnections } from '@/client/stores/appStore'
import s from './index.module.scss'
import { RedisSSLSwitch } from './RedisSSLSwitch'
import {
  createConnection,
  updateConnection,
} from '@/client/commands/api/connections'

interface RedisFormData {
  id?: string
  host: string
  port: string
  username: string
  password: string
}

const RedisFormSchema = z.object({
  host: z.string().min(1),
  port: z.string().min(1),
  username: z.string(),
  password: z.string(),
})

export type RedisFormMode = 0 | 1

interface RedisFormProps {
  defaultValues?: Partial<RedisFormData>
  mode?: RedisFormMode
}

const DEFAULT_DATA: RedisFormData = {
  host: '',
  port: '',
  username: '',
  password: '',
}

export const RedisForm: React.FC<RedisFormProps> = ({
  defaultValues,
  mode = 1,
}) => {
  const navigate = useNavigate()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [values, setValues] = useState<RedisFormData>({
    ...DEFAULT_DATA,
    ...defaultValues,
  })

  const onChange = (newValues: Partial<typeof values>) => {
    setValues((pre) => ({ ...pre, ...newValues }))
  }

  const validateValues = async () => {
    return RedisFormSchema.safeParseAsync(values)
  }

  const onCreateConnection = async () => {
    const { success, data, error } = await validateValues()
    if (!success) {
      console.error(error)
      toast.error('Form Data Error')
      return
    }
    setSubmitLoading(true)
    toast.promise(createConnection(data), {
      loading: 'Loading...',
      success(newConnectionId) {
        navigate(`/${newConnectionId}`)
        queryConnections()
        return 'Create Connection Successfully'
      },
      error(error) {
        console.error(error)
        return error.message || 'Create Connection Failed'
      },
      finally() {
        setSubmitLoading(false)
      },
    })
  }

  const onSaveConnection = async () => {
    const { success, data, error } = await validateValues()
    console.log(data, values)
    if (!success) {
      console.error(error)
      toast.error('Form Data Error')
      return
    }
    setSubmitLoading(true)
    if (defaultValues?.id) {
      toast.promise(updateConnection(defaultValues.id, data), {
        loading: 'Loading...',
        success() {
          queryConnections()
          return 'Update Connection Successfully'
        },
        error(error) {
          console.error(error)
          return error.message || 'Update Connection Failed'
        },
        finally() {
          setSubmitLoading(false)
        },
      })
    }
  }

  return (
    <Box display="flex" flexDirection="column" gap="var(--spacing-md)">
      <Box className={s.RedisForm} gap="var(--spacing-md)">
        <FormField name="host" label="Host">
          <Input
            value={values.host}
            onChange={(e) => {
              onChange({ host: e.target.value.trim() })
            }}
            placeholder="HOST"
          />
        </FormField>

        <FormField name="port" label="Port">
          <Input
            value={values.port}
            onChange={(e) => {
              onChange({ port: e.target.value.trim() })
            }}
            placeholder="PORT"
          />
        </FormField>

        <FormField name="username" label="Username">
          <Input
            value={values.username}
            onChange={(e) => {
              onChange({ username: e.target.value.trim() })
            }}
            placeholder="USER NAME"
          />
        </FormField>

        <FormField name="password" label="Password">
          <Input
            value={values.password}
            onChange={(e) => {
              onChange({ password: e.target.value.trim() })
            }}
            placeholder="PASSWORD"
          />
        </FormField>

        <FormField name="ssl" label="SSL">
          <RedisSSLSwitch />
        </FormField>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        gap="var(--spacing-md)"
      >
        {mode === 0 && (
          <Button
            onClick={onSaveConnection}
            loading={submitLoading}
            disabled={submitLoading}
          >
            Save Connection
          </Button>
        )}

        {mode === 1 && (
          <Button
            onClick={onCreateConnection}
            loading={submitLoading}
            disabled={submitLoading}
          >
            Create Connection
          </Button>
        )}
      </Box>
    </Box>
  )
}
