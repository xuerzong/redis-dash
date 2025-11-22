import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { RouterProvider } from 'react-router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { router } from './router'
import { initWebsocket } from './utils/ws'
import 'normalize.css'
import './index.css'

initWebsocket()

const root = createRoot(document.getElementById('root')!)

root.render(
  <ErrorBoundary>
    <RouterProvider router={router} />
    <Toaster richColors position="top-center" />
  </ErrorBoundary>
)
