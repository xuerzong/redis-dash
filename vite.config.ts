import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'

export default defineConfig({
  build: {
    outDir: path.resolve(process.cwd(), 'dist', 'client'),
    rollupOptions: {
      output: {
        manualChunks: {
          'cm-vendor': [
            'codemirror',
            '@codemirror/lang-json',
            '@codemirror/state',
          ],
          'xterm-vendor': ['@xterm/xterm', '@xterm/addon-fit'],
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
