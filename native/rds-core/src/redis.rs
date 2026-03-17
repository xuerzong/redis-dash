use dashmap::DashMap;
use once_cell::sync::Lazy;
use redis::{aio::PubSub, Client, ConnectionAddr, ConnectionInfo, RedisConnectionInfo, Value};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::sync::Arc;
use tokio::{fs, sync::OnceCell};

use crate::parse_redis_value;

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

async fn safe_read_file(path: &Option<String>) -> Option<Vec<u8>> {
    let Some(path) = path else {
        return None;
    };

    fs::read(path).await.ok()
}
