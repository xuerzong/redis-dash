import { isTauri } from '@tauri-apps/api/core'

export const checkForDesktopUpdates = async () => {
  if (!isTauri()) {
    return null
  }

  const { check } = await import('@tauri-apps/plugin-updater')
  return check({ timeout: 30_000 })
}
