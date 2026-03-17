import { build } from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'

const rootDir = process.cwd()

const main = async () => {
  await fs.rm(path.resolve(rootDir, 'dist', 'server.js'), { force: true })

  await build({
    entryPoints: [path.resolve(rootDir, 'src', 'index.ts')],
    bundle: true,
    minify: true,
    outfile: path.resolve(rootDir, 'dist', 'server.cjs'),
    format: 'cjs',
    platform: 'node',
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
