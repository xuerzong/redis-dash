use std::{io, path::{Path, PathBuf}};

use tokio::fs;

pub(crate) async fn ensure_cache_layout() -> Result<(), String> {
    migrate_legacy_cache_root().await?;
    let root = cache_root()?;
    fs::create_dir_all(root.join("db").join("connections"))
        .await
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(root.join("uploads"))
        .await
        .map_err(|error| error.to_string())
}

async fn migrate_legacy_cache_root() -> Result<(), String> {
    let new_root = cache_root()?;
    let legacy_root = legacy_cache_root()?;

    if fs::try_exists(&new_root)
        .await
        .map_err(|error| error.to_string())?
    {
        return Ok(());
    }

    if !fs::try_exists(&legacy_root)
        .await
        .map_err(|error| error.to_string())?
    {
        return Ok(());
    }

    fs::rename(&legacy_root, &new_root)
        .await
        .map_err(|error| error.to_string())
}

pub(crate) fn cache_root() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|path| path.join(".redis-dash-cache"))
        .ok_or_else(|| "failed to resolve home directory".to_string())
}

fn legacy_cache_root() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|path| path.join(".redis-studio-cache"))
        .ok_or_else(|| "failed to resolve home directory".to_string())
}

pub(crate) fn pid_file_path() -> Result<PathBuf, String> {
    Ok(cache_root()?.join("rs-server.pid"))
}

pub(crate) async fn read_pid(path: &Path) -> Result<Option<u32>, String> {
    match fs::read_to_string(path).await {
        Ok(content) => content
            .trim()
            .parse::<u32>()
            .map(Some)
            .map_err(|error| error.to_string()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

pub(crate) async fn write_pid(path: &Path, pid: u32) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|error| error.to_string())?;
    }
    fs::write(path, pid.to_string())
        .await
        .map_err(|error| error.to_string())
}

pub(crate) fn resolve_asset_root(input: Option<PathBuf>) -> Result<PathBuf, String> {
    let mut candidates = Vec::new();

    if let Some(path) = input {
        candidates.push(path);
    }

    if let Ok(path) = std::env::var("RDS_ASSET_ROOT") {
        candidates.push(PathBuf::from(path));
    }

    if let Ok(current_dir) = std::env::current_dir() {
        candidates.push(current_dir.join("app").join("dist"));
        candidates.push(current_dir.join("dist").join("app"));
    }

    if let Ok(executable) = std::env::current_exe() {
        if let Some(executable_dir) = executable.parent() {
            candidates.push(executable_dir.join("app"));
            candidates.push(executable_dir.join("dist").join("app"));
            candidates.push(executable_dir.join("..").join("app"));
            candidates.push(
                executable_dir
                    .join("..")
                    .join("..")
                    .join("..")
                    .join("app")
                    .join("dist"),
            );
        }
    }

    for candidate in candidates {
        if candidate.join("index.html").exists() {
            return candidate.canonicalize().map_err(|error| error.to_string());
        }
    }

    Err("unable to resolve app asset root; set RDS_ASSET_ROOT explicitly".to_string())
}

pub(crate) fn print_banner(text: &str) {
    let padding_x = 2usize;
    let padding_y = 1usize;
    let width = text.chars().count() + (padding_x * 2) + 2;
    let border = "*".repeat(width);
    println!("{border}");
    for _ in 0..padding_y {
        println!("*{}*", " ".repeat(width - 2));
    }
    println!(
        "*{}{}{}*",
        " ".repeat(padding_x),
        text,
        " ".repeat(padding_x)
    );
    for _ in 0..padding_y {
        println!("*{}*", " ".repeat(width - 2));
    }
    println!("{border}");
}