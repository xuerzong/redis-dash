import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { Octokit } from '@octokit/rest'

const GITHUB_REPO = 'xuerzong/redis-dash'
const [owner, repo] = GITHUB_REPO.split('/')
const args = process.argv.slice(2)

const getArgValue = (name) => {
  const exact = `--${name}`
  const prefix = `--${name}=`

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === exact) {
      return args[index + 1]
    }
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length)
    }
  }

  return undefined
}

const hasFlag = (name) => args.includes(`--${name}`)

const normalizeVersion = (value) => value.replace(/^v/, '')

const printUsage = () => {
  console.log(`Usage:
  npm run release:updater-json -- --version 0.1.0
  RDS_VERSION=v0.1.0 npm run release:updater-json

Version resolution order:
  1. --version <version>
  2. RDS_VERSION environment variable
  3. current git tag from \
     git describe --tags --exact-match
`)
}

const readVersionFromGitTag = () => {
  try {
    const output = execFileSync(
      'git',
      ['describe', '--tags', '--exact-match'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    ).trim()

    return output || undefined
  } catch {
    return undefined
  }
}

const inferPlatformKey = (assetName) => {
  if (assetName.endsWith('.AppImage')) {
    if (assetName.includes('_aarch64')) return 'linux-aarch64'
    if (assetName.includes('_x64')) return 'linux-x86_64'
    if (assetName.includes('_amd64')) return 'linux-x86_64'
  }

  if (assetName.endsWith('.app.tar.gz')) {
    if (assetName.includes('_aarch64')) return 'darwin-aarch64'
    if (assetName.includes('_x64')) return 'darwin-x86_64'
  }

  if (assetName.endsWith('.exe')) {
    if (assetName.includes('_x64-setup')) return 'windows-x86_64'
    if (assetName.includes('_aarch64-setup')) return 'windows-aarch64'
    if (assetName.includes('_x86-setup')) return 'windows-i686'
  }

  return null
}

const findReleaseInList = async (octokit, tag) => {
  const releases = await octokit.paginate(octokit.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  })

  return releases.find((release) => release.tag_name === tag)
}

const fetchRelease = async (octokit, tag) => {
  try {
    const { data } = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    })
    return data
  } catch (error) {
    if (error?.status !== 404) {
      throw error
    }
  }

  const release = await findReleaseInList(octokit, tag)
  if (release) {
    return release
  }

  throw new Error(
    `Release ${tag} was not found. GitHub may hide draft releases from getReleaseByTag, so the release must exist in listReleases as well.`
  )
}

const main = async () => {
  if (hasFlag('help')) {
    printUsage()
    return
  }

  const versionArg =
    getArgValue('version') || process.env.RDS_VERSION || readVersionFromGitTag()

  if (!versionArg) {
    throw new Error(
      'Missing version. Pass --version <version>, set RDS_VERSION, or run the script from an exact git tag checkout.'
    )
  }

  const version = normalizeVersion(versionArg)
  const tag = `v${version}`
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  })

  const release = await fetchRelease(octokit, tag)

  const signatureUrls = new Map(
    release.assets
      .filter((asset) => asset.name.endsWith('.sig'))
      .map((asset) => [asset.name.slice(0, -4), asset.browser_download_url])
  )

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rds-updater-'))

  try {
    const platforms = {}

    for (const asset of release.assets) {
      const platformKey = inferPlatformKey(asset.name)
      if (!platformKey) {
        continue
      }

      const signatureUrl = signatureUrls.get(asset.name)
      if (!signatureUrl) {
        continue
      }

      const signatureResponse = await fetch(signatureUrl, {
        headers: {
          'User-Agent': 'redis-dash-updater-json',
        },
      })

      if (!signatureResponse.ok) {
        throw new Error(
          `Failed to download signature for ${asset.name}: ${signatureResponse.status}`
        )
      }

      const signaturePath = path.join(tempDir, `${asset.name}.sig`)
      await fs.writeFile(
        signaturePath,
        Buffer.from(await signatureResponse.arrayBuffer())
      )

      const signature = (await fs.readFile(signaturePath, 'utf8')).trim()

      platforms[platformKey] = {
        url: `https://download.xuco.me/redis-dash/v${version}/${asset.name}`,
        signature,
      }
    }

    const outputDir = path.resolve(process.cwd(), 'release-artifacts')
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(
      path.join(outputDir, 'latest.json'),
      `${JSON.stringify(
        {
          version,
          notes: release.body || '',
          pub_date: release.published_at || new Date().toISOString(),
          platforms,
        },
        null,
        2
      )}\n`
    )
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
