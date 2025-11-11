import http from 'node:http'

type Resp = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage
}

export const ok = (
  res: Resp,
  content: any,
  headers: http.OutgoingHttpHeaders = {}
) => {
  res.writeHead(200, headers)
  res.end(content)
}

export const serverError = (res: Resp, content = 'Internal Server Error') => {
  res.writeHead(500, { 'content-type': 'text/plain' })
  res.end(content)
}
