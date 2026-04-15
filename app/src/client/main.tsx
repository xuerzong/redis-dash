import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { DesktopUpdateBootstrap } from './components/tauri/DesktopUpdateBootstrap'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './components/ui/Toaster'
import { router } from './router'
import { IntlProvider } from './providers/IntlProvider'
import { ConfigProvider } from './providers/ConfigProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { disableContextMenu } from './utils/contextmenu'
import '@xuerzong/redis-dash-invoke/init'

import 'normalize.css'
import './index.css'

const root = createRoot(document.getElementById('root')!)

disableContextMenu()

root.render(
  <ErrorBoundary>
    <ConfigProvider>
      <ThemeProvider>
        <IntlProvider>
          <RouterProvider router={router} />
          <Toaster />
          <DesktopUpdateBootstrap />
        </IntlProvider>
      </ThemeProvider>
    </ConfigProvider>
  </ErrorBoundary>
)
