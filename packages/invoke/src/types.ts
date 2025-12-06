export type InvokeFunc = <T = any>(command: string, args: any) => Promise<T>

type Connection = any

export interface API {
  getConnections: () => Promise<Connection[]>
  createConnection: (data: Connection) => Promise<string>
  updateConnection: (id: string, data: Connection) => Promise<string>
  delConnection: (id: string) => Promise<void>
  getConnectionStatus: (id: string) => Promise<number>
  postDisconnectConnection: (id: string) => Promise<any>

  getSystemConfig: () => Promise<any>
  setSystemConfig: (config: any) => Promise<any>
}
