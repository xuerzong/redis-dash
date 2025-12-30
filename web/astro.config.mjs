// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: 'https://redis-dash.xuco.me',
  base: '/',
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'en',
  },
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
  routing: {
    prefixDefaultLocale: false,
  },
})
