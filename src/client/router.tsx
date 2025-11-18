import { createHashRouter } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'
import CreatePage from './views/Create'
import InstancePage from './views/Instance'
import SettingsPage from './views/Settings'
import LoadingPage from './views/Loading'
import HomePage from './views/Home'
import RedisSettingsPage from './views/RedisSettings'

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '',
        element: <AppLayout />,
        children: [
          {
            path: '',
            element: <HomePage />,
          },
          {
            path: 'create',
            element: <CreatePage />,
          },
          {
            path: ':instanceId',
            element: <InstancePage />,
          },
          {
            path: ':instanceId/settings',
            element: <RedisSettingsPage />,
          },
        ],
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <LoadingPage />,
  },
])
