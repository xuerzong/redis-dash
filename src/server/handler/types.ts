import http from 'node:http'

export type HandlerFunc = (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage
  },
  next?: HandlerFunc
) => Promise<any>

export type BaseHandlerFunc = (next?: HandlerFunc) => HandlerFunc
