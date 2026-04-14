use std::{env, path::Path, time::Duration};

use futures_util::StreamExt;
use semver::Version;
use serde::Deserialize;
use tempfile::NamedTempFile;
use tokio::{fs, io::AsyncWriteExt};

use crate::{commands, models::SelfUpdateOptions};

const DEFAULT_BINARY_MIRROR: &str = "https://download.xuco.me/redis-dash";
const LATEST_MANIFEST_URL: &str = "https://download.xuco.me/redis-dash/latest.json";
const DOWNLOAD_TIMEOUT_SECS: u64 = 120;

#[derive(Debug, Deserialize)]
struct LatestReleaseManifest {
    version: String,
}

pub(crate) async fn run_self_update(options: SelfUpdateOptions) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(DOWNLOAD_TIMEOUT_SECS))
        .user_agent(format!("rds/{}/self-update", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|error| error.to_string())?;

    let current_version = parse_version(env!("CARGO_PKG_VERSION"))?;
    let target_version = match options.version.as_deref() {
        Some(version) => parse_version(&normalize_version(version))?,
        None => fetch_latest_version(&client).await?,
    };

    if options.version.is_none() && target_version <= current_version {
        println!("rds is already up to date (v{current_version}).");
        return Ok(());
    }

    if options.check {
        println!("Update available: v{current_version} -> v{target_version}");
        return Ok(());
    }

    let asset_name = release_asset_name();
    let download_url = resolve_download_url(&target_version, &asset_name)?;

    println!("Updating rds from v{current_version} to v{target_version}...");
    println!("Downloading {asset_name}...");

    if cfg!(windows) {
        let _ = commands::stop_background_server().await;
    }

    let temp_file = NamedTempFile::new().map_err(|error| error.to_string())?;
    let temp_path = temp_file.path().to_path_buf();
    download_binary(&client, &download_url, &temp_path).await?;

    #[cfg(not(windows))]
    {
        use std::os::unix::fs::PermissionsExt;

        let permissions = std::fs::Permissions::from_mode(0o755);
        std::fs::set_permissions(&temp_path, permissions).map_err(|error| error.to_string())?;
    }

    self_replace::self_replace(&temp_path).map_err(|error| error.to_string())?;

    println!("Updated successfully to v{target_version}.");
    Ok(())
}

async fn fetch_latest_version(client: &reqwest::Client) -> Result<Version, String> {
    let response = client
        .get(LATEST_MANIFEST_URL)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Err(format!(
                "latest manifest not found at {LATEST_MANIFEST_URL}; publish latest.json to R2 before using self-update"
            ));
        }
        return Err(format!(
            "failed to query latest manifest: {}",
            response.status()
        ));
    }

    let manifest: LatestReleaseManifest =
        response.json().await.map_err(|error| error.to_string())?;

    parse_version(&normalize_version(&manifest.version))
}

async fn download_binary(
    client: &reqwest::Client,
    url: &str,
    destination: &Path,
) -> Result<(), String> {
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!("download failed: {}", response.status()));
    }

    let mut stream = response.bytes_stream();
    let mut file = fs::File::create(destination)
        .await
        .map_err(|error| error.to_string())?;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| error.to_string())?;
        file.write_all(&chunk)
            .await
            .map_err(|error| error.to_string())?;
    }

    file.flush().await.map_err(|error| error.to_string())
}

fn resolve_download_url(version: &Version, asset_name: &str) -> Result<String, String> {
    if let Ok(url) = env::var("RDS_BINARY_URL") {
        return Ok(url);
    }

    let version = version.to_string();

    if let Ok(mirror) = env::var("RDS_BINARY_MIRROR") {
        return Ok(format!(
            "{}/v{version}/{asset_name}",
            mirror.trim_end_matches('/')
        ));
    }

    Ok(format!("{DEFAULT_BINARY_MIRROR}/v{version}/{asset_name}"))
}

fn release_asset_name() -> String {
    let platform = match env::consts::OS {
        "macos" => "darwin",
        "linux" => "linux",
        "windows" => "win32",
        other => other,
    };
    let arch = match env::consts::ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        other => other,
    };
    let ext = if cfg!(windows) { ".exe" } else { "" };
    format!("rds-{platform}-{arch}{ext}")
}

fn normalize_version(version: &str) -> String {
    version.trim().trim_start_matches('v').to_string()
}

fn parse_version(version: &str) -> Result<Version, String> {
    Version::parse(version).map_err(|error| error.to_string())
}
