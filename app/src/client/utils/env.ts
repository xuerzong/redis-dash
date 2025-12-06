declare global {
  interface Window {
    __TAURI__: any
  }
}

export const isTauri = () => {
  return Boolean(window.__TAURI__)
}
