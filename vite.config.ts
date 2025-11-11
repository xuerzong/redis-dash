import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'

export default defineConfig({
  build: {
    outDir: path.resolve(process.cwd(), 'dist', 'client'),
  },
  plugins: [react(), tsconfigPaths({})],
})
