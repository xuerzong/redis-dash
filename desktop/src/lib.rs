pub mod commands;
pub mod redis_map;
pub mod utils;

use commands::redis::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      send_redis_command,
      close_redis_command,
      run_redis_psubscribe,
      run_redis_punsubscribe
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
