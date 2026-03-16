use std::{path::PathBuf, sync::Arc};

use axum::extract::ws::{Message, WebSocket};
use clap::{Args, Parser, Subcommand};
use futures_util::stream::SplitSink;
use rds_core::{RedisConfig, RedisMap};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use tokio::sync::Mutex;

#[derive(Parser, Debug)]
#[command(
    name = "rds",
    version,
    about = "This is a lightweight Redis Manager.",
    disable_help_subcommand = true
)]
pub(crate) struct Cli {
    #[command(subcommand)]
    pub(crate) command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
pub(crate) enum Commands {
    /// start rds in background
    Start(ServerOptions),
    /// stop rds background server and its children
    Stop,
    /// stop then start redis-studio background server
    Restart(ServerOptions),
    /// check rds status
    Status,
    #[command(hide = true)]
    Serve(ServerOptions),
}

#[derive(Args, Debug, Clone)]
pub(crate) struct ServerOptions {
    #[arg(long, default_value_t = 5090)]
    pub(crate) port: u16,
    #[arg(long, env = "RDS_ASSET_ROOT")]
    pub(crate) asset_root: Option<PathBuf>,
}

#[derive(Debug, Clone)]
pub(crate) struct AppState {
    pub(crate) asset_root: PathBuf,
    pub(crate) upload_dir: PathBuf,
    pub(crate) config_path: PathBuf,
    pub(crate) connections_dir: PathBuf,
    pub(crate) redis_map: Arc<RedisMap>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ConnectionData {
    pub(crate) host: String,
    #[serde(default)]
    pub(crate) username: String,
    #[serde(default)]
    pub(crate) password: String,
    pub(crate) port: u16,
    #[serde(default)]
    pub(crate) ca: Option<String>,
    #[serde(default)]
    pub(crate) key: Option<String>,
    #[serde(default)]
    pub(crate) cert: Option<String>,
    #[serde(default)]
    pub(crate) id: Option<String>,
}

impl ConnectionData {
    pub(crate) fn redis_config(&self) -> RedisConfig {
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

#[derive(Debug, Deserialize)]
pub(crate) struct RequestEnvelope {
    #[serde(rename = "type")]
    pub(crate) request_type: String,
    #[serde(default)]
    pub(crate) data: JsonValue,
    #[serde(rename = "requestId")]
    pub(crate) request_id: String,
    #[serde(default)]
    pub(crate) role: Option<String>,
}

#[derive(Debug, Serialize)]
pub(crate) struct ResponseEnvelope {
    #[serde(rename = "type")]
    pub(crate) response_type: String,
    pub(crate) data: JsonValue,
    #[serde(rename = "requestId")]
    pub(crate) request_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) code: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct HttpInvokeRequest {
    pub(crate) method: String,
    pub(crate) url: String,
    #[serde(default)]
    pub(crate) body: JsonValue,
}

#[derive(Debug, Deserialize)]
pub(crate) struct RedisInvokeRequest {
    pub(crate) id: String,
    pub(crate) command: String,
    #[serde(default)]
    pub(crate) args: Vec<JsonValue>,
    #[serde(default)]
    pub(crate) role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct DisconnectBody {
    #[serde(default)]
    pub(crate) role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct StatusQuery {
    pub(crate) id: String,
}

pub(crate) type WebSocketSender = Arc<Mutex<SplitSink<WebSocket, Message>>>;
