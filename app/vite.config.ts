import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'cm-vendor': [
            'codemirror',
            '@codemirror/lang-json',
            '@codemirror/state',
          ],
          'xterm-vendor': [
            '@xterm/xterm',
            '@xterm/addon-fit',
            '@xterm/addon-canvas',
            '@xterm/addon-webgl',
          ],
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': [
            '@base-ui-components/react',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-icons',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'sonner',
            'react-resizable-panels',
          ],
        },
      },
    },
  },
  plugins: [react(), tsconfigPaths({})],
})
