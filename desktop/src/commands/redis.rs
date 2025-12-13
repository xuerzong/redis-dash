use crate::redis_map::{get_redis_map, RedisConfig};
use crate::utils::parse_redis_value::parse_redis_value;
use futures_util::StreamExt;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Emitter;
use tokio::task::JoinHandle;

static TASK_HANDLES: Lazy<Mutex<HashMap<String, JoinHandle<()>>>> =
  Lazy::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
pub async fn run_redis_psubscribe(
  app_handle: tauri::AppHandle,
  redis_config: RedisConfig,
  channel: String,
) -> Result<String, String> {
  let channel_key_external = channel.clone();
  let channel_key_in_task = channel_key_external.clone();

  if TASK_HANDLES
    .lock()
    .unwrap()
    .contains_key(&channel_key_external)
  {
    return Err(format!(
      "Already subscribing to pattern: {}",
      channel_key_external
    ));
  }

  let redis_map = get_redis_map();
  let instance = redis_map
    .get_instance(&redis_config)
    .await
    .map_err(|e| format!("Failed to connect or get instance: {}", e))?;

  let mut pub_sub = instance
    .get_async_pubsub()
    .await
    .map_err(|e| format!("Failed to connect or get instance: {}", e))?;

  let handle = tokio::spawn(async move {
    if let Err(e) = pub_sub.psubscribe(channel_key_in_task.clone()).await {
      let _ = app_handle.emit(
        "redis_pubsub_error",
        format!(
          "PSUBSCRIBE failed for pattern {}: {}",
          channel_key_in_task, e
        ),
      );
      let _ = TASK_HANDLES.lock().unwrap().remove(&channel_key_in_task);
      return;
    }

    let mut msg_stream = pub_sub.on_message();

    while let Some(msg) = msg_stream.next().await {
      let channel: String = msg.get_channel().unwrap_or_default();
      let payload: String = msg.get_payload().unwrap_or_default();

      let pubsub_data = serde_json::json!({
          "channel": channel,
          "pattern": msg.get_pattern::<String>().unwrap_or_default(),
          "message": payload,
      });

      if let Err(e) = app_handle.emit("redis_pubsub_message", pubsub_data) {
        eprintln!("Error emitting message to frontend: {}", e);
      }
    }
    let _ = TASK_HANDLES.lock().unwrap().remove(&channel_key_in_task);
  });

  TASK_HANDLES
    .lock()
    .unwrap()
    .insert(channel_key_external.clone(), handle);

  Ok(format!("Subscribed to pattern: {}", channel_key_external))
}

#[tauri::command]
pub async fn run_redis_punsubscribe(channel: String) -> Result<String, String> {
  let mut handles = TASK_HANDLES
    .lock()
    .map_err(|_| "Failed to lock task handles Mutex")?;

  if let Some(handle) = handles.remove(&channel) {
    handle.abort();

    Ok(format!(
      "Successfully aborted subscription for pattern: {}",
      channel
    ))
  } else {
    Err(format!(
      "No active subscription found for pattern: {}",
      channel
    ))
  }
}

#[tauri::command]
pub async fn send_redis_command(
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
pub async fn close_redis_command(redis_config: RedisConfig) -> Result<(), String> {
  let redis_map = get_redis_map();
  redis_map.remove_instance(&redis_config);
  Ok(())
}
