import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { RouterProvider } from 'react-router'
import { DesktopUpdateBootstrap } from './components/tauri/DesktopUpdateBootstrap'
import { ErrorBoundary } from './components/ErrorBoundary'
import { router } from './router'
import { IntlProvider } from './providers/IntlProvider'
import { ConfigProvider } from './providers/ConfigProvider'
import { disableContextMenu } from './utils/contextmenu'
import '@xuerzong/redis-dash-invoke/init'

import 'normalize.css'
import './index.css'

const root = createRoot(document.getElementById('root')!)

disableContextMenu()

root.render(
  <ErrorBoundary>
    <ConfigProvider>
      <IntlProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
        <DesktopUpdateBootstrap />
      </IntlProvider>
    </ConfigProvider>
  </ErrorBoundary>
)
