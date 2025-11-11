import { build } from 'esbuild'
import path from 'node:path'
const rootDir = process.cwd()

const main = () => {
  build({
    entryPoints: [path.resolve(rootDir, 'src', 'index.ts')],
    bundle: true,
    minify: false,
    outfile: path.resolve(rootDir, 'dist', 'server.mjs'),
    format: 'esm',
    platform: 'node',
    external: ['ws', 'zod', 'nanoid', 'ioredis'],
  })
}

main()
