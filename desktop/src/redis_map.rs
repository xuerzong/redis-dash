use dashmap::DashMap;
use once_cell::sync::Lazy;
use redis::{Client, ConnectionAddr, ConnectionInfo, RedisConnectionInfo, RedisError};
use serde::Deserialize;
use std::sync::Arc;
use tokio::fs;
use tokio::sync::OnceCell;

#[derive(Debug, Clone, Hash, Eq, PartialEq, Deserialize)]
pub struct RedisConfig {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub ca: Option<String>,
    pub key: Option<String>,
    pub cert: Option<String>,
}

async fn safe_read_file(path_opt: &Option<String>) -> Option<Vec<u8>> {
    if let Some(path) = path_opt {
        match fs::read(path).await {
            Ok(content) => return Some(content),
            Err(e) => {
                #[cfg(debug_assertions)]
                eprintln!("Warning: Failed to read file '{}': {}", path, e);
            }
        }
    }
    None
}

type RedisInstanceCell = Arc<OnceCell<Arc<Client>>>;

pub struct RedisMap {
    instances: DashMap<String, RedisInstanceCell>,
}

impl RedisMap {
    pub fn new() -> Self {
        RedisMap {
            instances: DashMap::new(),
        }
    }

    fn get_key(config: &RedisConfig) -> String {
        format!(
            "redis://{}@{}:{}/{}",
            config.username.as_deref().unwrap_or("default"),
            config.host,
            config.port,
            config.password.as_deref().unwrap_or("")
        )
    }

    pub async fn get_instance(&self, config: &RedisConfig) -> Result<Arc<Client>, RedisError> {
        let key = Self::get_key(config);

        let cell = self
            .instances
            .entry(key.clone())
            .or_insert_with(|| Arc::new(OnceCell::new()))
            .clone();

        let instance = cell
            .get_or_try_init(|| async { self.create_connection(config).await })
            .await?;

        Ok(instance.clone())
    }

    async fn create_connection(&self, config: &RedisConfig) -> Result<Arc<Client>, RedisError> {
        let tls_ca = safe_read_file(&config.ca).await;
        let tls_cert = safe_read_file(&config.cert).await;
        let tls_key = safe_read_file(&config.key).await;

        let use_tls = tls_ca.is_some() || tls_cert.is_some() || tls_key.is_some();

        let addr = if use_tls {
            ConnectionAddr::TcpTls {
                host: config.host.clone(),
                port: config.port,
                insecure: true,
                tls_params: None,
            }
        } else {
            ConnectionAddr::Tcp(config.host.clone(), config.port)
        };

        let redis_info = RedisConnectionInfo {
            db: 0,
            username: config.username.clone().filter(|s| !s.is_empty()),
            password: config.password.clone().filter(|s| !s.is_empty()),
            protocol: redis::ProtocolVersion::RESP2,
        };

        let conn_info = ConnectionInfo {
            addr,
            redis: redis_info,
        };

        let client = Client::open(conn_info)?;

        #[cfg(debug_assertions)]
        println!(
            "Created new Redis Client (TLS: {}) for host: {}",
            use_tls, config.host
        );

        Ok(Arc::new(client))
    }

    pub fn remove_instance(&self, config: &RedisConfig) {
        let key = Self::get_key(config);
        self.instances.remove(&key);
    }
}

static REDIS_MAP: Lazy<Arc<RedisMap>> = Lazy::new(|| Arc::new(RedisMap::new()));

pub fn get_redis_map() -> Arc<RedisMap> {
    REDIS_MAP.clone()
}
