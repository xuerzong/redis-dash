pub mod redis_map;

use crate::redis_map::{get_redis_map, RedisConfig};

use serde_json::{json, Value as JsonValue};

fn parse_redis_value(v: redis::Value) -> JsonValue {
    match v {
        redis::Value::Nil => JsonValue::Null,
        redis::Value::Int(i) => json!(i),
        redis::Value::BulkString(bytes) => json!(String::from_utf8_lossy(&bytes)),
        redis::Value::Array(list) => {
            let json_list: Vec<JsonValue> = list.into_iter().map(parse_redis_value).collect();
            JsonValue::Array(json_list)
        }
        redis::Value::SimpleString(s) => json!(s),
        other => json!(format!("{:?}", other)),
    }
}

#[tauri::command]
async fn send_redis_command(
    redis_config: RedisConfig,
    command: String,
    args: Vec<String>,
) -> Result<serde_json::Value, String> {
    let redis_map = get_redis_map();

    let instance = redis_map
        .get_instance(&redis_config)
        .await
        .map_err(|e| format!("Failed to connect or get instance: {}", e))?;

    let mut conn = instance
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| format!("Failed to get connection: {}", e))?;

    let mut cmd = redis::cmd(&command);
    for arg in args {
        cmd.arg(arg);
    }

    let result: redis::Value = cmd
        .query_async(&mut conn)
        .await
        .map_err(|e| format!("Redis execution error: {}", e))?;

    Ok(parse_redis_value(result))
}

#[tauri::command]
async fn close_redis_command(redis_config: RedisConfig) -> Result<(), String> {
    let redis_map = get_redis_map();
    redis_map.remove_instance(&redis_config);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![send_redis_command, close_redis_command])
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
