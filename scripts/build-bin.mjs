import { build } from 'esbuild'
import path from 'node:path'
const rootDir = process.cwd()

const main = () => {
  build({
    entryPoints: [path.resolve(rootDir, 'bin', 'index.ts')],
    bundle: false,
    minify: false,
    outfile: path.resolve(rootDir, 'dist', 'bin.mjs'),
    format: 'esm',
    platform: 'node',
  })
}

main()
