use std::{process::{Command, Stdio}, time::Duration};

use tokio::fs;

use crate::{
    models::ServerOptions,
    paths::{ensure_cache_layout, pid_file_path, print_banner, read_pid, resolve_asset_root, write_pid},
    process::{detach_command, process_exists, terminate_process},
};

pub(crate) async fn start_background_server(options: ServerOptions) -> Result<(), String> {
    ensure_cache_layout().await?;

    let pid_path = pid_file_path()?;
    if let Some(pid) = read_pid(&pid_path).await? {
        if process_exists(pid) {
            println!("Server already seems to be running (PID: {pid}).");
            return Ok(());
        }
        let _ = fs::remove_file(&pid_path).await;
    }

    let asset_root = resolve_asset_root(options.asset_root.clone())?;
    let executable = std::env::current_exe().map_err(|error| error.to_string())?;
    let mut command = Command::new(executable);
    command
        .arg("serve")
        .arg("--port")
        .arg(options.port.to_string())
        .arg("--asset-root")
        .arg(&asset_root)
        .env("RDS_ASSET_ROOT", &asset_root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    detach_command(&mut command)?;

    let child = command.spawn().map_err(|error| error.to_string())?;
    let pid = child.id();
    write_pid(&pid_path, pid).await?;

    println!(
        "Redis Studio started in background (PID: {pid}) on port {}",
        options.port
    );
    println!("You can open it in your browser:\n");
    print_banner(&format!("🚀 http://127.0.0.1:{}", options.port));
    Ok(())
}

pub(crate) async fn stop_background_server() -> Result<(), String> {
    let pid_path = pid_file_path()?;
    let Some(pid) = read_pid(&pid_path).await? else {
        println!("RDS server is not running.");
        return Ok(());
    };

    if !process_exists(pid) {
        let _ = fs::remove_file(&pid_path).await;
        println!("RDS server is not running.");
        return Ok(());
    }

    terminate_process(pid)?;

    for _ in 0..20 {
        if !process_exists(pid) {
            break;
        }
        tokio::time::sleep(Duration::from_millis(150)).await;
    }

    let _ = fs::remove_file(&pid_path).await;
    println!("Stop RDS successfully.");
    Ok(())
}

pub(crate) async fn print_status() {
    match pid_file_path() {
        Ok(pid_path) => match read_pid(&pid_path).await {
            Ok(Some(pid)) if process_exists(pid) => println!("✔ Running"),
            _ => println!("✖ Not Running"),
        },
        Err(_) => println!("✖ Not Running"),
    }
}