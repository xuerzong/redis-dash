import { build } from 'esbuild'
import path from 'node:path'
import packageJson from '../package.json' with { type: 'json' }
const rootDir = process.cwd()

const main = () => {
  build({
    entryPoints: [path.resolve(rootDir, 'src', 'cli', 'index.ts')],
    bundle: true,
    minify: false,
    outfile: path.resolve(rootDir, 'dist', 'cli.mjs'),
    format: 'esm',
    platform: 'node',
    external: [...Object.keys(packageJson.dependencies)],
    banner: {
      js: '#!/usr/bin/env node',
    },
  })
}

main()
