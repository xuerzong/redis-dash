use dashmap::DashMap;
use nanoid::nanoid;
use once_cell::sync::Lazy;
use redis::{aio::PubSub, Client, ConnectionAddr, ConnectionInfo, RedisConnectionInfo, Value};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value as JsonValue};
use std::{
    io,
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::{fs, sync::OnceCell};

#[derive(Debug, Clone, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub struct RedisConfig {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub ca: Option<String>,
    pub key: Option<String>,
    pub cert: Option<String>,
}

type RedisInstanceCell = Arc<OnceCell<Arc<Client>>>;

#[derive(Debug)]
pub struct RedisMap {
    instances: DashMap<String, RedisInstanceCell>,
}

impl RedisMap {
    pub fn new() -> Self {
        Self {
            instances: DashMap::new(),
        }
    }

    fn cache_key(config: &RedisConfig, role: &str) -> String {
        format!(
            "{}:{}:{}:{}:{}",
            config.host,
            config.port,
            config.username.as_deref().unwrap_or_default(),
            config.password.as_deref().unwrap_or_default(),
            role
        )
    }

    pub async fn get_instance(&self, config: &RedisConfig) -> Result<Arc<Client>, String> {
        self.get_instance_with_role(config, "default").await
    }

    pub async fn get_instance_with_role(
        &self,
        config: &RedisConfig,
        role: &str,
    ) -> Result<Arc<Client>, String> {
        let key = Self::cache_key(config, role);
        let cell = self
            .instances
            .entry(key)
            .or_insert_with(|| Arc::new(OnceCell::new()))
            .clone();

        let client = cell
            .get_or_try_init(|| async move { Self::create_connection(config).await })
            .await
            .map_err(|error| error.to_string())?;

        Ok(client.clone())
    }

    pub fn remove_instance(&self, config: &RedisConfig) {
        self.remove_instance_with_role(config, "default")
    }

    pub fn remove_instance_with_role(&self, config: &RedisConfig, role: &str) {
        self.instances.remove(&Self::cache_key(config, role));
    }

    async fn create_connection(config: &RedisConfig) -> Result<Arc<Client>, redis::RedisError> {
        let tls_enabled = safe_read_file(&config.ca).await.is_some()
            || safe_read_file(&config.key).await.is_some()
            || safe_read_file(&config.cert).await.is_some();

        let addr = if tls_enabled {
            ConnectionAddr::TcpTls {
                host: config.host.clone(),
                port: config.port,
                insecure: true,
                tls_params: None,
            }
        } else {
            ConnectionAddr::Tcp(config.host.clone(), config.port)
        };

        let redis = RedisConnectionInfo {
            db: 0,
            username: config.username.clone().filter(|value| !value.is_empty()),
            password: config.password.clone().filter(|value| !value.is_empty()),
            protocol: redis::ProtocolVersion::RESP2,
        };

        let client = Client::open(ConnectionInfo { addr, redis })?;
        Ok(Arc::new(client))
    }
}

impl Default for RedisMap {
    fn default() -> Self {
        Self::new()
    }
}

static GLOBAL_REDIS_MAP: Lazy<Arc<RedisMap>> = Lazy::new(|| Arc::new(RedisMap::new()));

pub fn global_redis_map() -> Arc<RedisMap> {
    GLOBAL_REDIS_MAP.clone()
}

pub async fn open_redis_pubsub(
    redis_map: Arc<RedisMap>,
    config: &RedisConfig,
    role: &str,
) -> Result<PubSub, String> {
    let client = redis_map.get_instance_with_role(config, role).await?;
    client
        .get_async_pubsub()
        .await
        .map_err(|error| error.to_string())
}

pub async fn execute_redis_command(
    redis_map: Arc<RedisMap>,
    config: &RedisConfig,
    role: &str,
    command: &str,
    args: &[String],
) -> Result<JsonValue, String> {
    let client = redis_map.get_instance_with_role(config, role).await?;
    let mut multiplexed = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|error| error.to_string())?;

    let mut cmd = redis::cmd(command);
    for argument in args {
        cmd.arg(argument);
    }

    let value: Value = cmd
        .query_async(&mut multiplexed)
        .await
        .map_err(|error| error.to_string())?;

    Ok(parse_redis_value(value))
}

pub fn parse_redis_value(value: Value) -> JsonValue {
    match value {
        Value::Nil => JsonValue::Null,
        Value::Int(value) => json!(value),
        Value::BulkString(bytes) => json!(String::from_utf8_lossy(&bytes).to_string()),
        Value::Array(values) => {
            JsonValue::Array(values.into_iter().map(parse_redis_value).collect())
        }
        Value::SimpleString(value) => json!(value),
        Value::Okay => json!("OK"),
        Value::Map(entries) => JsonValue::Array(
            entries
                .into_iter()
                .map(|(key, value)| json!([parse_redis_value(key), parse_redis_value(value)]))
                .collect(),
        ),
        Value::Attribute { data, attributes } => json!({
          "data": parse_redis_value(*data),
          "attributes": attributes
            .into_iter()
            .map(|(key, value)| json!([parse_redis_value(key), parse_redis_value(value)]))
            .collect::<Vec<_>>()
        }),
        Value::Set(values) => JsonValue::Array(values.into_iter().map(parse_redis_value).collect()),
        Value::Double(value) => json!(value),
        Value::Boolean(value) => json!(value),
        Value::VerbatimString { text, .. } => json!(text),
        Value::BigNumber(value) => json!(value.to_string()),
        Value::Push { kind, data } => json!({
          "kind": format!("{kind:?}"),
          "data": data.into_iter().map(parse_redis_value).collect::<Vec<_>>()
        }),
        Value::ServerError(error) => json!(format!("{error:?}")),
    }
}

pub async fn list_json_records(records_dir: &Path) -> Result<Vec<(String, JsonValue)>, String> {
    fs::create_dir_all(records_dir)
        .await
        .map_err(|error| error.to_string())?;

    let mut entries = fs::read_dir(records_dir)
        .await
        .map_err(|error| error.to_string())?;
    let mut records = Vec::new();

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|error| error.to_string())?
    {
        let path = entry.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }

        let Some(id) = path.file_stem().and_then(|value| value.to_str()) else {
            continue;
        };

        if let Some(record) = find_json_record(records_dir, id).await? {
            records.push((id.to_string(), record));
        }
    }

    Ok(records)
}

pub async fn find_json_record(records_dir: &Path, id: &str) -> Result<Option<JsonValue>, String> {
    let path = record_file_path(records_dir, id)?;
    let content = match fs::read_to_string(&path).await {
        Ok(content) => content,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    serde_json::from_str(&content)
        .map(Some)
        .map_err(|error| error.to_string())
}

pub async fn create_json_record(records_dir: &Path, payload: JsonValue) -> Result<String, String> {
    fs::create_dir_all(records_dir)
        .await
        .map_err(|error| error.to_string())?;

    let id = payload
        .get("id")
        .and_then(JsonValue::as_str)
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| nanoid!(8));

    let mut object = payload
        .as_object()
        .cloned()
        .ok_or_else(|| "record payload must be an object".to_string())?;
    object.remove("id");

    fs::write(
        record_file_path(records_dir, &id)?,
        serde_json::to_vec_pretty(&JsonValue::Object(object)).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())?;

    Ok(id)
}

pub async fn update_json_record(
    records_dir: &Path,
    id: &str,
    payload: JsonValue,
) -> Result<(), String> {
    let path = record_file_path(records_dir, id)?;
    let current = match fs::read_to_string(&path).await {
        Ok(content) => serde_json::from_str::<JsonValue>(&content).unwrap_or_else(|_| json!({})),
        Err(error) if error.kind() == io::ErrorKind::NotFound => json!({}),
        Err(error) => return Err(error.to_string()),
    };

    let merged = merge_json_objects(current, payload)?;
    let object = merged
        .as_object()
        .cloned()
        .ok_or_else(|| "record payload must be an object".to_string())?;

    fs::write(
        path,
        serde_json::to_vec_pretty(&JsonValue::Object(object)).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())
}

pub async fn delete_json_record(records_dir: &Path, id: &str) -> Result<(), String> {
    let path = record_file_path(records_dir, id)?;
    match fs::remove_file(path).await {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

pub async fn get_json_config(config_path: &Path) -> Result<JsonValue, String> {
    match fs::read_to_string(config_path).await {
        Ok(content) => serde_json::from_str(&content).map_err(|error| error.to_string()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(JsonValue::Null),
        Err(error) => Err(error.to_string()),
    }
}

pub async fn set_json_config(config_path: &Path, payload: JsonValue) -> Result<(), String> {
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|error| error.to_string())?;
    }

    fs::write(
        config_path,
        serde_json::to_vec_pretty(&payload).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())
}

fn record_file_path(records_dir: &Path, id: &str) -> Result<PathBuf, String> {
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("invalid record id".to_string());
    }

    Ok(records_dir.join(format!("{id}.json")))
}

fn merge_json_objects(current: JsonValue, next: JsonValue) -> Result<JsonValue, String> {
    let mut current_object = current.as_object().cloned().unwrap_or_else(Map::new);
    let next_object = next
        .as_object()
        .cloned()
        .ok_or_else(|| "record payload must be an object".to_string())?;

    for (key, value) in next_object {
        if key == "id" {
            continue;
        }
        current_object.insert(key, value);
    }

    Ok(JsonValue::Object(current_object))
}

async fn safe_read_file(path: &Option<String>) -> Option<Vec<u8>> {
    let Some(path) = path else {
        return None;
    };

    fs::read(path).await.ok()
}
