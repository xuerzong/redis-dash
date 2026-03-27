import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const FIXED_REPO = 'xuerzong/redis-dash'
const args = process.argv.slice(2)

const getArgValue = (name) => {
  const exact = `--${name}`
  const prefix = `--${name}=`

  for (let i = 0; i < args.length; i += 1) {
    const value = args[i]
    if (value === exact) {
      return args[i + 1]
    }
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length)
    }
  }

  return undefined
}

const hasFlag = (name) => args.includes(`--${name}`)

const printUsage = () => {
  console.log(`Usage:
  npm run upload:release:r2 -- --version 0.1.1
  npm run upload:release:r2 -- --tag v0.1.1

Description:
  Download release assets from fixed repo ${FIXED_REPO}
  and upload them to R2 as: v<version>/<assetName>

Required env:
  CF_R2_API_TOKEN (or CLOUDFLARE_API_TOKEN)
  CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID)
  CF_R2_BUCKET

Optional:
  --asset <name>   Upload only one asset (repeatable)
  --dry-run        Print actions without uploading
`)
}

const required = (value, name, hint) => {
  if (!value) {
    throw new Error(`${name} is required. ${hint}`)
  }
  return value
}

const normalizeVersion = (value) => value.replace(/^v/, '')

const getAllArgValues = (name) => {
  const exact = `--${name}`
  const prefix = `--${name}=`
  const output = []

  for (let i = 0; i < args.length; i += 1) {
    const value = args[i]
    if (value === exact && args[i + 1]) {
      output.push(args[i + 1])
      i += 1
      continue
    }
    if (value.startsWith(prefix)) {
      output.push(value.slice(prefix.length))
    }
  }

  return output
}

const fetchRelease = async (tag) => {
  const url = `https://api.github.com/repos/${FIXED_REPO}/releases/tags/${encodeURIComponent(tag)}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'redis-dash-r2-uploader',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Failed to fetch release by tag ${tag}: ${response.status} ${body}`
    )
  }

  return response.json()
}

const downloadAsset = async ({ version, assetName, outFile }) => {
  const url = `https://github.com/${FIXED_REPO}/releases/download/v${version}/${assetName}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'redis-dash-r2-uploader',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Failed to download ${assetName}: ${response.status} ${body}`
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(outFile, buffer)
  return url
}

const uploadToR2 = ({
  filePath,
  bucket,
  objectKey,
  accountId,
  token,
  dryRun,
}) => {
  const objectPath = `${bucket}/${objectKey}`
  const cmdArgs = [
    '-y',
    'wrangler@4',
    'r2',
    'object',
    'put',
    objectPath,
    `--file=${filePath}`,
  ]

  if (dryRun) {
    console.log(`[dry-run] npx ${cmdArgs.join(' ')}`)
    return
  }

  const result = spawnSync('npx', cmdArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: token,
      CLOUDFLARE_ACCOUNT_ID: accountId,
    },
  })

  if (result.status !== 0) {
    throw new Error(`R2 upload failed: ${objectPath}`)
  }
}

const main = async () => {
  if (hasFlag('help') || hasFlag('h')) {
    printUsage()
    return
  }

  const versionInput = getArgValue('version') || getArgValue('tag')
  const version = normalizeVersion(
    required(
      versionInput,
      'version/tag',
      'Pass --version 0.1.1 or --tag v0.1.1'
    )
  )
  const tag = `v${version}`
  const selectedAssets = new Set(getAllArgValues('asset'))
  const dryRun = hasFlag('dry-run')

  const token = process.env.CF_R2_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
  const accountId =
    process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
  const bucket = process.env.CF_R2_BUCKET

  required(
    token,
    'CF_R2_API_TOKEN',
    'Set CF_R2_API_TOKEN or CLOUDFLARE_API_TOKEN'
  )
  required(
    accountId,
    'CF_ACCOUNT_ID',
    'Set CF_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID'
  )
  required(bucket, 'CF_R2_BUCKET', 'Set CF_R2_BUCKET')

  console.log(`[repo] ${FIXED_REPO}`)
  console.log(`[tag] ${tag}`)
  console.log(`[bucket] ${bucket}`)

  const release = await fetchRelease(tag)
  const assets = Array.isArray(release.assets) ? release.assets : []

  if (assets.length === 0) {
    console.log('[release] No assets found, nothing to upload.')
    return
  }

  const targets =
    selectedAssets.size > 0
      ? assets.filter((asset) => selectedAssets.has(asset.name))
      : assets

  if (targets.length === 0) {
    throw new Error('No matching assets found for provided --asset filters.')
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rds-release-'))

  try {
    for (const asset of targets) {
      const localPath = path.join(tempDir, asset.name)
      const sourceUrl = await downloadAsset({
        version,
        assetName: asset.name,
        outFile: localPath,
      })

      const objectKey = `v${version}/${asset.name}`
      const mirrorUrl = `https://download.xuco.me/${objectKey}`

      console.log(`[download] ${sourceUrl}`)
      console.log(`[upload] r2://${bucket}/${objectKey}`)
      console.log(`[mirror] ${mirrorUrl}`)

      uploadToR2({
        filePath: localPath,
        bucket,
        objectKey,
        accountId,
        token,
        dryRun,
      })
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }

  console.log('[done] All release assets uploaded to R2.')
}

main().catch((error) => {
  console.error('[error] Upload failed.')
  console.error(error.message)
  process.exit(1)
})

// CF_R2_API_TOKEN=cfat_... CF_ACCOUNT_ID=9a0b... CF_R2_BUCKET=... node scripts/upload-release-assets-to-r2.mjs --version 0.1.0
