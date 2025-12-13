interface WebSocketMessageState {
  type: string
  data: any
  requestId: string
  code?: number
}

export class WebSocketMessage implements WebSocketMessageState {
  public type: string
  public data: any
  public requestId: string
  public code: number
  constructor(input: WebSocketMessageState) {
    this.data = input.data
    this.type = input.type
    this.requestId = input.requestId
    this.code = input.code || 0
  }

  public toString() {
    return JSON.stringify({
      data: this.data,
      type: this.type,
      requestId: this.requestId,
    })
  }
}
