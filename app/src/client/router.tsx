import { createHashRouter } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'
import { RedisLayout } from './layouts/RedisLayout'
import CreatePage from './views/Create'
import RedisPage from './views/Redis'
import LoadingPage from './views/Loading'
import HomePage from './views/Home'
import RedisSettingsPage from './views/RedisSettings'
import RedisTerminalPage from './views/RedisTerminal'

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
            path: ':redisId/',
            element: <RedisLayout />,
            children: [
              {
                path: '',
                element: <RedisPage />,
              },
              {
                path: 'settings',
                element: <RedisSettingsPage />,
              },
              {
                path: 'terminal',
                element: <RedisTerminalPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <LoadingPage />,
  },
])
