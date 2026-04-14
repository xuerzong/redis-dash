<div align="center">
  <img src="./assets/hero.png" >
</div>

<div align='center'>
  <a href="https://github.com/xuerzong/redis-dash/blob/main/LICENSE">
    <img  src="https://img.shields.io/github/license/xuerzong/redis-dash?style=for-the-badge&color=52e892" alt="github">
  </a>
</div>

<p align="center">English | <a href="./README.zh-CN.md">简体中文</a></p>

🚀 **Redis Dash** is a cross-platform Redis GUI (Graphical User Interface) Client. Redis Dash is designed to provide a simple and efficient way to manage and monitor your Redis instances.

<p align='center'>
  <img src='./assets/screenshot.png'>
</p>

## ✨ Features

- 🔗 **Multi-Connection Support:** Easily manage and switch between multiple Redis instances.
- 🔎 **Intuitive Key Browser:** Browse, search, edit, and delete various data types (String, List, Hash, Set, ZSet).
- 💻 **Built-in CLI Console:** A powerful Redis Command Line Interface (CLI) allows you to execute native Redis commands directly.
- 🌍 **Cross-Platform:** Supports Windows, macOS, and Linux.

## 🚀 Get Started

### Install

> [!IMPORTANT]
> npm installation is no longer supported. Please use the latest install script.

Install Redis Dash with the standalone installer:

```bash
curl -fsSL https://download.xuco.me/redis-dash/install.sh | sh
```

The install script downloads the current platform bundle, installs it under `/usr/local/lib/redis-dash` or `~/.local/share/redis-dash`, and links `rds` into `/usr/local/bin` or `~/.local/bin`.

The installer uses `https://download.xuco.me/redis-dash` as the default distribution source.

### Start Server

> [!NOTE]
> Redis Dash runs as a standalone application, and its server provides the web interface. You still require a running Redis instance to connect to and manage your data.

After installation, use the `rds` command to manage the background service for Redis Dash.

- Check Version

```bash
rds --version # OR `rds -V`
```

- Start Service

```bash
rds start
```

- Stop Service

```bash
rds stop
```

- Restart Service

```bash
rds restart
```

## 🔨 Configuration

### Default Settgins

By default, the Redis Dash service runs on port `5090` on localhost.

### Custom Port

You can specify a different port using a command-line flag when starting the service:

```bash
rds start --port 9000
```

## 💻 How To Dev

```bash
cd ./redis-dash

npm install

npm run start
```

## 📦 Release

Build the web assets, compile the Rust server binary, and prepare standalone binary artifacts:

```bash
npm run release
```

After the command finishes:

- The platform native binary is in `dist/native/<platform>/rds`
- The standalone binary bundle is in `dist/binary/<platform>`
- The standalone install archive is in `dist/binary/rds-<platform>.tar.gz`

GitHub Actions release flow:

- Push a `v*` tag to build binaries and create or update the draft GitHub Release.
- Review the draft release manually.
- When the release is ready for users, run the `Publish Updater Manifest` workflow with that version so `latest.json` is attached to the release.
- Then run the `Upload Release to R2` workflow to mirror the release assets and `latest.json` to `https://download.xuco.me/redis-dash`.
