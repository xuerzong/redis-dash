import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@client/components/ui/Button'
import { useIntlContext } from '@client/providers/IntlProvider'
import { checkForDesktopUpdates } from '@client/utils/desktopUpdate'

let activeUpdateToastId: string | number | null = null

const dismissActiveUpdateToast = () => {
  if (activeUpdateToastId == null) {
    return
  }
  toast.dismiss(activeUpdateToastId)
  activeUpdateToastId = null
}

const askToInstallUpdate = (
  version: string,
  formatMessage: (id: string) => string
) => {
  return new Promise<boolean>((resolve) => {
    let settled = false
    let toastId: string | number = ''

    const settle = (value: boolean) => {
      if (settled) {
        return
      }
      settled = true
      toast.dismiss(toastId)
      if (activeUpdateToastId === toastId) {
        activeUpdateToastId = null
      }
      resolve(value)
    }

    dismissActiveUpdateToast()

    toastId = toast.custom(
      () => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minWidth: '320px',
            backgroundColor: 'var(--background-color)',
            padding: '16px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
            Redis Dash {version} {formatMessage('update.available')}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <Button type="button" variant="ghost" onClick={() => settle(false)}>
              {formatMessage('update.skip')}
            </Button>
            <Button type="button" onClick={() => settle(true)}>
              {formatMessage('update.install')}
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        onDismiss: () => settle(false),
      }
    )

    activeUpdateToastId = toastId
  })
}

export const DesktopUpdateBootstrap = () => {
  const { formatMessage } = useIntlContext()

  useEffect(() => {
    dismissActiveUpdateToast()

    const timer = window.setTimeout(async () => {
      try {
        const update = await checkForDesktopUpdates()
        if (!update) {
          return
        }

        const shouldInstall = await askToInstallUpdate(
          update.version,
          formatMessage
        )
        if (!shouldInstall) {
          return
        }

        const toastId = toast.loading(formatMessage('update.downloading'))

        try {
          await update.downloadAndInstall()
          toast.success(formatMessage('update.installed'), {
            id: toastId,
            duration: 8000,
          })
        } catch (error) {
          toast.error(
            error instanceof Error && error.message
              ? error.message
              : formatMessage('update.failed'),
            {
              id: toastId,
            }
          )
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (!message || /updater/i.test(message)) {
          return
        }
        toast.error(message)
      }
    }, 0)

    return () => {
      window.clearTimeout(timer)
      dismissActiveUpdateToast()
    }
  }, [formatMessage])

  return null
}
