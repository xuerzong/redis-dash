declare global {
  interface Window {
    invoke: (type: string, data: any) => Promise<any>
    invokeMessages: string[]
    invokeCallbacks: Map<
      string,
      {
        resolve: (data: any) => void
        reject: (error: any) => void
      }
    >
  }
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
    window.invokeCallbacks.set(requestId, {
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
        window.invokeCallbacks.set(requestId, {
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
    if (import.meta.env.MODE === 'development') {
      console.log(
        `%c[${new Date().toLocaleString()}]`,
        'color:#059669;font-weight:bold',
        'Client Receive'
      )
      console.log({ type, data, requestId })
    }

    if (requestId) {
      if (code === -1) {
        window.invokeCallbacks.get(requestId)?.reject(data)
      } else {
        window.invokeCallbacks.get(requestId)?.resolve(data)
      }
      window.invokeCallbacks.delete(requestId)
    }
  }

  let retryTimes = 5
  ws.onclose = () => {
    if (retryTimes < 0) return
    retryTimes--
    initWebsocket()
  }
}
