import { string, z } from 'zod'

export const WebSocketMessageSchema = z.object({
  type: z.string(),
  data: z.object({
    value: z.string(),
    type: z.string(),
  }),
})
