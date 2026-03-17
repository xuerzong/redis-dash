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
const BIN_VERSION_PATH = path.resolve(DIST_DIR, `${BIN_NAME}.version`)
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), 'package.json')
const DEFAULT_BINARY_MIRROR = 'https://download.xuco.me'
const DOWNLOAD_TIMEOUT_MS = Number(
  process.env.RDS_DOWNLOAD_TIMEOUT_MS ?? 120_000
)
const DOWNLOAD_AGENT = new https.Agent({
  keepAlive: true,
  timeout: DOWNLOAD_TIMEOUT_MS,
})

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

const resolveDownloadUrl = async (version) => {
  if (process.env.RDS_BINARY_URL) {
    return process.env.RDS_BINARY_URL
  }

  const assetName = getAssetName()

  if (process.env.RDS_BINARY_MIRROR) {
    return `${normalizeBaseUrl(process.env.RDS_BINARY_MIRROR)}/v${version}/${assetName}`
  }

  return `${DEFAULT_BINARY_MIRROR}/v${version}/${assetName}`
}

const logDownloadProgress = (response, platformId) => {
  const contentLengthHeader = response.headers['content-length']
  const totalBytes = Number(contentLengthHeader)

  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    return
  }

  let downloadedBytes = 0
  let lastLoggedPercent = 0

  response.on('data', (chunk) => {
    downloadedBytes += chunk.length
    const percent = Math.min(
      100,
      Math.floor((downloadedBytes / totalBytes) * 100)
    )

    if (percent >= 100 || percent - lastLoggedPercent >= 5) {
      lastLoggedPercent = percent
      console.log(
        `[redis-dash] Download progress (${platformId}): ${percent}% (${downloadedBytes}/${totalBytes} bytes)`
      )
    }
  })
}

const downloadFile = async (url, outputPath, redirectCount = 0) => {
  if (redirectCount > 5) {
    throw new Error('Too many redirects while downloading native binary.')
  }

  await new Promise((resolve, reject) => {
    const requestStartedAt = Date.now()
    const req = https.get(url, { agent: DOWNLOAD_AGENT }, (response) => {
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

      logDownloadProgress(response, PLATFORM_ID)

      pipeline(response, createWriteStream(outputPath))
        .then(resolve)
        .catch(reject)
    })

    req.on('error', reject)
    req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
      const elapsedMs = Date.now() - requestStartedAt
      req.destroy(
        new Error(
          `Download timeout after ${elapsedMs}ms (configured ${DOWNLOAD_TIMEOUT_MS}ms).`
        )
      )
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

  const version = await readPackageVersion()

  if (fs.existsSync(BIN_PATH) && fs.existsSync(BIN_VERSION_PATH)) {
    const installedVersion = (
      await fsPromises.readFile(BIN_VERSION_PATH, 'utf8')
    ).trim()

    if (installedVersion === version) {
      console.log(
        `[redis-dash] Native binary already installed for ${PLATFORM_ID} (v${version}).`
      )
      return
    }

    console.log(
      `[redis-dash] Native binary version mismatch for ${PLATFORM_ID}: installed v${installedVersion}, required v${version}. Re-downloading...`
    )
  } else if (fs.existsSync(BIN_PATH)) {
    console.log(
      `[redis-dash] Native binary found for ${PLATFORM_ID} without version metadata. Re-downloading...`
    )
  }

  const downloadUrl = await resolveDownloadUrl(version)
  const tempPath = path.resolve(
    os.tmpdir(),
    `redis-dash-${Date.now()}-${getAssetName()}`
  )

  await fsPromises.mkdir(DIST_DIR, { recursive: true })

  try {
    console.log(`[redis-dash] Downloading native binary for ${PLATFORM_ID}...`)
    await downloadFile(downloadUrl, tempPath)
    await fsPromises.copyFile(tempPath, BIN_PATH)
    await fsPromises.writeFile(BIN_VERSION_PATH, `${version}\n`, 'utf8')

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
