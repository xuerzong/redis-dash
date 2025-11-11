import { useState } from 'react'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { Input } from '@/client/components/ui/Input'
import { FormField } from '@/client/components/ui/Form'
import s from './index.module.scss'
import z from 'zod'

interface RedisFormData {
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

interface RedisFormProps {
  defaultValues?: Partial<RedisFormData>
}

const DEFAULT_DATA: RedisFormData = {
  host: '',
  port: '',
  username: '',
  password: '',
}

export const RedisForm: React.FC<RedisFormProps> = ({ defaultValues }) => {
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
    setSubmitLoading(true)
    const { success, data } = await validateValues()
    if (!success) {
    }
    console.log(data)
    setSubmitLoading(false)
  }

  const onSaveConnection = async () => {
    setSubmitLoading(true)
    const { success, data } = await validateValues()
    if (!success) {
    }
    console.log(data)
    setSubmitLoading(false)
  }

  return (
    <Box display="flex" flexDirection="column" gap="var(--spacing-md)">
      <Box className={s.redisForm} gap="var(--spacing-md)">
        <FormField name="host" label="Host">
          <Input
            value={values.host}
            onChange={(e) => {
              onChange({ host: e.target.value.trim() })
            }}
            placeholder="Input"
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
            placeholder="Input"
          />
        </FormField>

        <FormField name="password" label="Password">
          <Input
            value={values.password}
            onChange={(e) => {
              onChange({ password: e.target.value.trim() })
            }}
            placeholder="Input"
          />
        </FormField>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        gap="var(--spacing-md)"
      >
        <Button onClick={onSaveConnection} disabled={submitLoading}>
          Save Connection
        </Button>
        <Button onClick={onCreateConnection} disabled={submitLoading}>
          Create Connection
        </Button>
      </Box>
    </Box>
  )
}
