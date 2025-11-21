import http from 'node:http'

export type HttpRequest = http.IncomingMessage

export type HttpResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage
}

export type HandlerFunc = (
  req: HttpRequest,
  res: HttpResponse,
  next?: HandlerFunc
) => Promise<any>

export type BaseHandlerFunc = (next?: HandlerFunc) => HandlerFunc
