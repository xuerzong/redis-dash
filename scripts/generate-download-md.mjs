/**
 * Generate web/docs/download.md and web/docs/zh/download.md
 * by fetching the latest GitHub release of xuerzong/redis-dash.
 *
 * Usage:
 *   node scripts/generate-download-md.mjs
 *   node scripts/generate-download-md.mjs --tag v0.2.2
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const GITHUB_REPO = 'xuerzong/redis-dash'
const DOWNLOAD_BASE_URL = 'https://download.xuco.me/redis-dash'
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`
const args = process.argv.slice(2)
const getArg = (name) => {
  const i = args.indexOf(`--${name}`)
  if (i >= 0 && args[i + 1]) return args[i + 1]
  const pref = args.find((a) => a.startsWith(`--${name}=`))
  return pref ? pref.slice(name.length + 3) : undefined
}

const tag = getArg('tag')

/**
 * Platform rows in display order. Each entry maps to a release asset by regex
 * applied against the asset's `name`. Sigs and helper assets are filtered out.
 */
const PLATFORMS = [
  {
    en: 'macOS (Apple Silicon)',
    zh: 'macOS (Apple Silicon)',
    match: /_aarch64\.dmg$/,
  },
  { en: 'macOS (Intel)', zh: 'macOS (Intel)', match: /_x64\.dmg$/ },
  {
    en: 'Windows (x64, EXE)',
    zh: 'Windows (x64, EXE)',
    match: /_x64-setup\.exe$/,
  },
  {
    en: 'Windows (x64, MSI)',
    zh: 'Windows (x64, MSI)',
    match: /_x64_en-US\.msi$/,
  },
  {
    en: 'Linux (x86_64, AppImage)',
    zh: 'Linux (x86_64, AppImage)',
    match: /_amd64\.AppImage$/,
  },
  {
    en: 'Linux (aarch64, AppImage)',
    zh: 'Linux (aarch64, AppImage)',
    match: /_aarch64\.AppImage$/,
  },
  {
    en: 'Linux (x86_64, deb)',
    zh: 'Linux (x86_64, deb)',
    match: /_amd64\.deb$/,
  },
  {
    en: 'Linux (aarch64, deb)',
    zh: 'Linux (aarch64, deb)',
    match: /_arm64\.deb$/,
  },
  {
    en: 'Linux (x86_64, rpm)',
    zh: 'Linux (x86_64, rpm)',
    match: /\.x86_64\.rpm$/,
  },
  {
    en: 'Linux (aarch64, rpm)',
    zh: 'Linux (aarch64, rpm)',
    match: /\.aarch64\.rpm$/,
  },
]

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(2)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

const fetchRelease = async () => {
  const url = tag
    ? `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${tag}`
    : `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
  const headers = {
    'User-Agent': 'redis-dash-docs',
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
  return res.json()
}

const buildRows = (assets) =>
  PLATFORMS.map((p) => {
    const asset = assets.find(
      (a) => p.match.test(a.name) && !a.name.endsWith('.sig')
    )
    return asset ? { platform: p, asset } : null
  }).filter(Boolean)

const getAssetUrl = (tagName, assetName) =>
  `${DOWNLOAD_BASE_URL}/${tagName}/${encodeURIComponent(assetName)}`

const renderTable = (rows, headers, lang, tagName) =>
  [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(
      ({ platform, asset }) =>
        `| ${platform[lang]} | [${asset.name}](${getAssetUrl(tagName, asset.name)}) | ${formatSize(asset.size)} |`
    ),
  ].join('\n')

const renderDoc = ({
  lang,
  title,
  description,
  version,
  publishedAt,
  tagName,
  headers,
  rows,
}) => `---
title: ${title}
description: ${description}
---

# ${title}

${
  lang === 'en'
    ? `Latest version: **${version}** · Published: ${publishedAt}`
    : `当前版本：**${version}** · 发布于：${publishedAt}`
}

${renderTable(rows, headers, lang, tagName)}

${
  lang === 'en'
    ? `Looking for [past releases](${GITHUB_RELEASES_URL})?`
    : `历史版本请查看 [GitHub Releases](${GITHUB_RELEASES_URL})。`
}
`

const main = async () => {
  const release = await fetchRelease()
  const version = release.tag_name.replace(/^v/, '')
  const publishedAt = release.published_at?.slice(0, 10) ?? ''
  const rows = buildRows(release.assets)
  if (!rows.length) throw new Error('No matching assets found in release.')

  const en = renderDoc({
    lang: 'en',
    title: 'Download',
    description: 'Download Redis Dash for macOS, Windows, and Linux.',
    version,
    publishedAt,
    tagName: release.tag_name,
    headers: ['Name', 'File Name', 'Size'],
    rows,
  })
  const zh = renderDoc({
    lang: 'zh',
    title: '下载',
    description: '下载 Redis Dash，支持 macOS、Windows 和 Linux。',
    version,
    publishedAt,
    tagName: release.tag_name,
    headers: ['名称', '文件名称', '大小'],
    rows,
  })

  await fs.writeFile(path.join(ROOT, 'web/docs/download.md'), en)
  await fs.writeFile(path.join(ROOT, 'web/docs/zh/download.md'), zh)
  console.log(
    `Wrote download.md (en, zh) for ${release.tag_name} with ${rows.length} rows.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
