#!/bin/sh

set -eu

PROJECT_NAME="redis-dash"
BIN_NAME="rds"
DEFAULT_BASE_URL="https://download.xuco.me/redis-dash"

BASE_URL="$DEFAULT_BASE_URL"
VERSION="${RDS_VERSION:-latest}"
INSTALL_ROOT="${RDS_INSTALL_ROOT:-}"
BIN_DIR="${RDS_BIN_DIR:-}"

log() {
  printf '[%s] %s\n' "$PROJECT_NAME" "$1"
}

fail() {
  printf '[%s] %s\n' "$PROJECT_NAME" "$1" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_platform() {
  os="$(uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m 2>/dev/null)"

  case "$os" in
    darwin)
      platform_os="darwin"
      ;;
    linux)
      platform_os="linux"
      ;;
    *)
      fail "Unsupported operating system: ${os:-unknown}"
      ;;
  esac

  case "$arch" in
    x86_64|amd64)
      platform_arch="x64"
      ;;
    arm64|aarch64)
      platform_arch="arm64"
      ;;
    *)
      fail "Unsupported architecture: ${arch:-unknown}"
      ;;
  esac

  PLATFORM_ID="${platform_os}-${platform_arch}"
  ASSET_NAME="${BIN_NAME}-${PLATFORM_ID}.tar.gz"
}

resolve_download_url() {
  base="${BASE_URL%/}"

  if [ "$VERSION" = "latest" ]; then
    DOWNLOAD_URL="${base}/latest/${ASSET_NAME}"
  else
    DOWNLOAD_URL="${base}/v${VERSION}/${ASSET_NAME}"
  fi
}

detect_install_dirs() {
  if [ -z "$INSTALL_ROOT" ]; then
    if [ -w "/usr/local/lib" ]; then
      INSTALL_ROOT="/usr/local/lib/${PROJECT_NAME}"
    else
      INSTALL_ROOT="$HOME/.local/share/${PROJECT_NAME}"
    fi
  fi

  if [ -z "$BIN_DIR" ]; then
    if [ -w "/usr/local/bin" ]; then
      BIN_DIR="/usr/local/bin"
    else
      BIN_DIR="$HOME/.local/bin"
    fi
  fi

  if [ -d "$BIN_DIR" ] || mkdir -p "$BIN_DIR" 2>/dev/null; then
    return
  fi

  fail "Unable to create binary directory ${BIN_DIR}. Set RDS_BIN_DIR explicitly."
}

install_bundle() {
  command_exists tar || fail "tar is required to install ${BIN_NAME}"

  temp_dir="$(mktemp -d)"
  archive_path="${temp_dir}/${ASSET_NAME}"
  extract_dir="${temp_dir}/extract"

  cleanup() {
    rm -rf "$temp_dir"
  }

  trap cleanup EXIT INT TERM

  log "Downloading ${ASSET_NAME} from ${DOWNLOAD_URL}"

  if command_exists curl; then
    curl --fail --location --progress-bar --output "$archive_path" "$DOWNLOAD_URL"
  elif command_exists wget; then
    wget -O "$archive_path" "$DOWNLOAD_URL"
  else
    fail "curl or wget is required to install ${BIN_NAME}"
  fi

  mkdir -p "$extract_dir"
  tar -xzf "$archive_path" -C "$extract_dir"

  [ -f "${extract_dir}/${BIN_NAME}" ] || fail "Bundle is missing ${BIN_NAME}"
  [ -f "${extract_dir}/app/index.html" ] || fail "Bundle is missing app assets"

  if [ -d "$INSTALL_ROOT" ]; then
    if [ -w "$INSTALL_ROOT" ]; then
      rm -rf "$INSTALL_ROOT"
    elif command_exists sudo; then
      sudo rm -rf "$INSTALL_ROOT"
    else
      fail "No permission to replace ${INSTALL_ROOT}. Re-run with sudo or set RDS_INSTALL_ROOT."
    fi
  fi

  if [ -w "$(dirname "$INSTALL_ROOT")" ] || { [ -d "$INSTALL_ROOT" ] && [ -w "$INSTALL_ROOT" ]; }; then
    mkdir -p "$INSTALL_ROOT"
    cp -R "$extract_dir/." "$INSTALL_ROOT/"
  elif command_exists sudo; then
    sudo mkdir -p "$INSTALL_ROOT"
    sudo cp -R "$extract_dir/." "$INSTALL_ROOT/"
  else
    fail "No permission to write to ${INSTALL_ROOT}. Re-run with sudo or set RDS_INSTALL_ROOT."
  fi

  if [ -w "$BIN_DIR" ]; then
    ln -sf "$INSTALL_ROOT/$BIN_NAME" "$BIN_DIR/$BIN_NAME"
  elif command_exists sudo; then
    sudo mkdir -p "$BIN_DIR"
    sudo ln -sf "$INSTALL_ROOT/$BIN_NAME" "$BIN_DIR/$BIN_NAME"
  else
    fail "No permission to write to ${BIN_DIR}. Re-run with sudo or set RDS_BIN_DIR."
  fi

  trap - EXIT INT TERM
  cleanup
}

print_success() {
  log "Installed bundle to ${INSTALL_ROOT}"
  log "Linked ${BIN_NAME} to ${BIN_DIR}/${BIN_NAME}"

  case ":$PATH:" in
    *":${BIN_DIR}:"*)
      ;;
    *)
      log "${BIN_DIR} is not in PATH. Add this line to your shell profile:"
      printf 'export PATH="%s:$PATH"\n' "$BIN_DIR"
      ;;
  esac

  log "Run '${BIN_NAME} --version' to verify the installation."
}

detect_platform
resolve_download_url
detect_install_dirs
install_bundle
print_success