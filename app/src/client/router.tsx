import { createHashRouter } from 'react-router'
import { isTauri } from '@tauri-apps/api/core'
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
import SettingsThemePage from './views/Settings/Theme'
import SettingsInterfacePage from './views/Settings/Interface'
import SettingsAboutPage from './views/Settings/About'
import PubSubPage from './views/RedisPubSub'

const inTauri = isTauri()

const settingsChildren = [
  {
    path: '',
    element: <SettingsPage />,
  },
  {
    path: 'theme',
    element: <SettingsThemePage />,
  },
  {
    path: 'interface',
    element: <SettingsInterfacePage />,
  },
  {
    path: 'about',
    element: <SettingsAboutPage />,
  },
]

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
      ...(inTauri
        ? []
        : [
            {
              path: 'settings',
              element: <SettingsLayout />,
              children: settingsChildren,
            },
          ]),
    ],
  },
  ...(inTauri
    ? [
        {
          path: '/settings',
          element: <SettingsLayout />,
          children: settingsChildren,
        },
      ]
    : []),
  {
    path: '*',
    element: <LoadingPage />,
  },
])
