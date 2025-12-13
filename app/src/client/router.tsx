import { createHashRouter } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'
import { RedisLayout } from './layouts/RedisLayout'
import { SettingsLayout } from './layouts/SettingsLayout'
import CreatePage from './views/Create'
import RedisPage from './views/Redis'
import LoadingPage from './views/Loading'
import HomePage from './views/Home'
import RedisSettingsPage from './views/RedisSettings'
import RedisTerminalPage from './views/RedisTerminal'
import SettingsPage from './views/Settings'
import PubSubPage from './views/RedisPubSub'

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
              {
                path: 'pub-sub',
                element: <PubSubPage />,
              },
            ],
          },
        ],
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          {
            path: '',
            element: <SettingsPage />,
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
