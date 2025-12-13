declare global {
  interface Window {
    invoke: (type: string, data: any) => Promise<any>
    invokeMessages: string[]
    invokePromiseCallbacks: Map<
      string,
      {
        resolve: (data: any) => void
        reject: (error: any) => void
      }
    >
    invokeCallbacks: Map<string, (data: any, error?: any) => void>
  }
}

if (!window.invokePromiseCallbacks) {
  window.invokePromiseCallbacks = new Map()
}

if (!window.invokeCallbacks) {
  window.invokeCallbacks = new Map()
}

if (!window.invokeMessages) {
  window.invokeMessages = []
}

const generateRequestId = (type: string, data: any) => {
  let requestId = type
  if (type === 'sendCommand') {
    requestId += `_${data.command}`
    if (data.args && data.args.length) {
      requestId += `_${data.args.join('_')}`
    }
  }
  if (type === 'sendRequest') {
    requestId += `_${data.method}`
    requestId += `_${data.url}`
  }
  requestId += `_${Date.now()}`
  return requestId
}

window.invoke = async (type: string, data: any) => {
  const requestId = generateRequestId(type, data)
  window.invokeMessages.push(
    JSON.stringify({
      type,
      data,
      requestId: requestId,
    })
  )
  return new Promise((resolve, reject) => {
    window.invokePromiseCallbacks.set(requestId, {
      resolve,
      reject,
    })
  })
}

export const initWebsocket = () => {
  const { host } = window.location
  const ws = new WebSocket(`ws://${host}`)
  ws.onopen = () => {
    window.invoke = async (type: string, data: any) => {
      const requestId = generateRequestId(type, data)
      ws.send(JSON.stringify({ type, data, requestId }))
      return new Promise((resolve, reject) => {
        window.invokePromiseCallbacks.set(requestId, {
          resolve,
          reject,
        })
      })
    }
    const currentMessages = window.invokeMessages
    currentMessages.forEach((message) => {
      ws.send(message)
    })
    window.invokeMessages = []
  }

  ws.onmessage = (message) => {
    const { type, data, requestId, code } = JSON.parse(message.data)
    console.log(
      `%c[${new Date().toLocaleString()}]`,
      'color:#059669;font-weight:bold',
      'Client Receive'
    )
    console.log({ type, data, requestId })
    if (requestId) {
      if (code === -1) {
        window.invokeCallbacks.get(requestId)?.(null, data)
        window.invokePromiseCallbacks.get(requestId)?.reject(data)
      } else {
        window.invokeCallbacks.get(requestId)?.(data)
        window.invokePromiseCallbacks.get(requestId)?.resolve(data)
      }
      window.invokePromiseCallbacks.delete(requestId)
    }
  }

  let retryTimes = 5
  ws.onclose = () => {
    if (retryTimes < 0) return
    retryTimes--
    initWebsocket()
  }
}
