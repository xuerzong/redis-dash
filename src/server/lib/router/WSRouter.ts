import { match } from 'path-to-regexp'

type TBody = {
  [key: string]: any
}

type TQuery = {
  [key: string]: string
}

type TParams = {
  [key: string]: any
}

type TRequest = {
  url: string
  method: string
  query: TQuery
  params: TParams
  body: TBody
}

type HandlerFunc = (req: TRequest) => Promise<any>

export class WSRouter {
  routes: any[] = []

  get(path: string, handler: HandlerFunc) {
    this._route(path, handler, 'GET')
  }

  post(path: string, handler: HandlerFunc) {
    this._route(path, handler, 'POST')
  }

  put(path: string, handler: HandlerFunc) {
    this._route(path, handler, 'PUT')
  }

  del(path: string, handler: HandlerFunc) {
    this._route(path, handler, 'DELETE')
  }

  private _route(path: string, handler: HandlerFunc, method: string) {
    const pathMatcher = match(path, { decode: decodeURIComponent })
    this.routes.push({
      path,
      method,
      handler,
      pathMatcher,
    })
  }

  async route(method: string, url: string, data?: any) {
    const port = parseInt(process.env.PORT || '5090')
    const urlObj = new URL(url, `http://localhost:${port}`)

    const normalizedUrl = url.split('?')[0]

    for (const route of this.routes) {
      if (route.method === method) {
        const result = route.pathMatcher(normalizedUrl)

        if (result) {
          const params = result.params
          const query = {}
          urlObj.searchParams.forEach((value, key) => {
            query[key] = value
          })
          return route.handler({
            url,
            method,
            params,
            query,
            body: data,
          })
        }
      }
    }

    // pass?
  }
}
