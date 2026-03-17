import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import https from 'node:https'

const BIN_NAME = process.platform === 'win32' ? 'rds.exe' : 'rds'
const PLATFORM_ID = `${process.platform}-${process.arch}`
const DIST_DIR = path.resolve(process.cwd(), 'dist', 'native', PLATFORM_ID)
const BIN_PATH = path.resolve(DIST_DIR, BIN_NAME)
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), 'package.json')

const readPackageVersion = async () => {
  const raw = await fsPromises.readFile(PACKAGE_JSON_PATH, 'utf8')
  const data = JSON.parse(raw)

  if (!data.version) {
    throw new Error('Unable to resolve package version from package.json')
  }

  return String(data.version)
}

const getAssetName = () => {
  const ext = process.platform === 'win32' ? '.exe' : ''
  return `rds-${PLATFORM_ID}${ext}`
}

const normalizeBaseUrl = (input) => input.replace(/\/+$/, '')

const resolveDownloadUrl = async () => {
  if (process.env.RDS_BINARY_URL) {
    return process.env.RDS_BINARY_URL
  }

  const assetName = getAssetName()
  const version = await readPackageVersion()

  if (process.env.RDS_BINARY_MIRROR) {
    return `${normalizeBaseUrl(process.env.RDS_BINARY_MIRROR)}/v${version}/${assetName}`
  }

  return `https://github.com/xuerzong/redis-dash/releases/download/v${version}/${assetName}`
}

const downloadFile = async (url, outputPath, redirectCount = 0) => {
  if (redirectCount > 5) {
    throw new Error('Too many redirects while downloading native binary.')
  }

  await new Promise((resolve, reject) => {
    const req = https.get(url, (response) => {
      const statusCode = response.statusCode ?? 0
      const location = response.headers.location

      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        response.resume()
        const redirectUrl = location.startsWith('http')
          ? location
          : new URL(location, url).toString()

        downloadFile(redirectUrl, outputPath, redirectCount + 1)
          .then(resolve)
          .catch(reject)
        return
      }

      if (statusCode !== 200) {
        response.resume()
        reject(new Error(`Download failed with status ${statusCode}: ${url}`))
        return
      }

      pipeline(response, createWriteStream(outputPath))
        .then(resolve)
        .catch(reject)
    })

    req.on('error', reject)
    req.setTimeout(20000, () => {
      req.destroy(new Error('Download timeout (20s).'))
    })
  })
}

const ensureBinary = async () => {
  if (process.env.RDS_SKIP_POSTINSTALL === '1') {
    console.log(
      '[redis-dash] Skip native binary download (RDS_SKIP_POSTINSTALL=1).'
    )
    return
  }

  if (fs.existsSync(BIN_PATH)) {
    return
  }

  const downloadUrl = await resolveDownloadUrl()
  const tempPath = path.resolve(
    os.tmpdir(),
    `redis-dash-${Date.now()}-${getAssetName()}`
  )

  await fsPromises.mkdir(DIST_DIR, { recursive: true })

  try {
    console.log(`[redis-dash] Downloading native binary for ${PLATFORM_ID}...`)
    await downloadFile(downloadUrl, tempPath)
    await fsPromises.copyFile(tempPath, BIN_PATH)

    if (process.platform !== 'win32') {
      await fsPromises.chmod(BIN_PATH, 0o755)
    }
  } finally {
    await fsPromises.rm(tempPath, { force: true })
  }

  console.log(`[redis-dash] Native binary installed: ${BIN_PATH}`)
}

ensureBinary().catch((error) => {
  console.error('[redis-dash] Failed to install native binary.')
  console.error(`[redis-dash] ${error.message}`)
  console.error(
    '[redis-dash] You can set RDS_BINARY_MIRROR or RDS_BINARY_URL, then reinstall.'
  )
  process.exit(1)
})
