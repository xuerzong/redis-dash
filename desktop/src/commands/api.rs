use std::path::PathBuf;

use rds_core::{
  create_json_record, delete_json_record, execute_redis_command, find_json_record, get_json_config,
  global_redis_map, list_json_records, set_json_config, update_json_record, RedisConfig,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value as JsonValue};
use tokio::fs;
use url::Url;

#[derive(Debug, Deserialize, Serialize)]
pub struct ConnectionData {
  pub host: String,
  #[serde(default)]
  pub username: String,
  #[serde(default)]
  pub password: String,
  pub port: u16,
  #[serde(default)]
  pub ca: Option<String>,
  #[serde(default)]
  pub key: Option<String>,
  #[serde(default)]
  pub cert: Option<String>,
  #[serde(default)]
  pub id: Option<String>,
}

impl ConnectionData {
  pub fn redis_config(&self) -> RedisConfig {
    RedisConfig {
      host: self.host.clone(),
      port: self.port,
      username: (!self.username.is_empty()).then(|| self.username.clone()),
      password: (!self.password.is_empty()).then(|| self.password.clone()),
      ca: self.ca.clone(),
      key: self.key.clone(),
      cert: self.cert.clone(),
    }
  }
}

#[tauri::command]
pub async fn send_request(
  method: String,
  url: String,
  body: JsonValue,
) -> Result<JsonValue, String> {
  ensure_cache_layout().await?;

  let method = method.to_uppercase();
  let url = Url::parse(&format!("http://localhost{url}")).map_err(|error| error.to_string())?;
  let segments: Vec<&str> = url
    .path()
    .trim_matches('/')
    .split('/')
    .filter(|segment| !segment.is_empty())
    .collect();

  match (method.as_str(), segments.as_slice()) {
    ("GET", ["api", "connections"]) => list_connections().await,
    ("GET", ["api", "connections", "status"]) => {
      let id = url
        .query_pairs()
        .find(|(key, _)| key == "id")
        .map(|(_, value)| value.to_string())
        .ok_or_else(|| "missing query parameter: id".to_string())?;
      let Some(connection) = find_connection(&id).await? else {
        return Ok(json!(-1));
      };
      match execute_redis_command(
        global_redis_map(),
        &connection.redis_config(),
        "publisher",
        "PING",
        &[],
      )
      .await
      {
        Ok(value) => Ok(value),
        Err(_) => Ok(json!(-1)),
      }
    }
    ("POST", ["api", "connections"]) => create_json_record(&connections_dir(), body)
      .await
      .map(JsonValue::String),
    ("PUT", ["api", "connections", id]) => update_json_record(&connections_dir(), id, body)
      .await
      .map(|()| JsonValue::Null),
    ("DELETE", ["api", "connections", id]) => {
      delete_json_record(&connections_dir(), id).await?;
      Ok(JsonValue::Null)
    }
    ("POST", ["api", "connections", id, "disconnect"]) => {
      let role = body
        .get("role")
        .and_then(JsonValue::as_str)
        .unwrap_or("publisher");
      if let Some(connection) = find_connection(id).await? {
        global_redis_map().remove_instance_with_role(&connection.redis_config(), role);
      }
      Ok(JsonValue::Null)
    }
    ("GET", ["api", "config"]) => get_json_config(&config_path()).await,
    ("POST", ["api", "config"]) => {
      set_json_config(&config_path(), body).await?;
      Ok(JsonValue::Null)
    }
    _ => Ok(JsonValue::Null),
  }
}

async fn ensure_cache_layout() -> Result<(), String> {
  fs::create_dir_all(connections_dir())
    .await
    .map_err(|error| error.to_string())
}

fn cache_root() -> Result<PathBuf, String> {
  dirs::home_dir()
    .map(|path| path.join(".redis-dash-cache"))
    .ok_or_else(|| "failed to resolve home directory".to_string())
}

fn connections_dir() -> PathBuf {
  cache_root()
    .unwrap_or_else(|_| PathBuf::from(".redis-dash-cache"))
    .join("db")
    .join("connections")
}

fn config_path() -> PathBuf {
  cache_root()
    .unwrap_or_else(|_| PathBuf::from(".redis-dash-cache"))
    .join("config.json")
}

async fn find_connection(id: &str) -> Result<Option<ConnectionData>, String> {
  let Some(value) = find_json_record(&connections_dir(), id).await? else {
    return Ok(None);
  };

  let mut connection =
    serde_json::from_value::<ConnectionData>(value).map_err(|error| error.to_string())?;
  connection.id = Some(id.to_string());
  Ok(Some(connection))
}

async fn list_connections() -> Result<JsonValue, String> {
  let mut connections = Vec::new();

  for (id, value) in list_json_records(&connections_dir()).await? {
    let mut connection =
      serde_json::from_value::<ConnectionData>(value).map_err(|error| error.to_string())?;
    connection.id = Some(id);
    connections.push(serde_json::to_value(connection).map_err(|error| error.to_string())?);
  }

  Ok(JsonValue::Array(connections))
}
