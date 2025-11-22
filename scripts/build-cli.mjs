import { build } from 'esbuild'
import path from 'node:path'

const rootDir = process.cwd()

const main = () => {
  build({
    entryPoints: [path.resolve(rootDir, 'src', 'index.ts')],
    bundle: true,
    minify: true,
    outfile: path.resolve(rootDir, 'dist', 'cli.js'),
    format: 'cjs',
    platform: 'node',
    banner: {
      js: '#!/usr/bin/env node',
    },
  })
}

main()
