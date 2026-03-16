use std::{
    collections::HashMap,
    io,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::Arc,
    time::Duration,
};

use axum::{
    body::Body,
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Multipart, Path as AxumPath, Query, State,
    },
    http::{header, HeaderMap, HeaderValue, Method, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{get, post, put},
    Json, Router,
};
use clap::{Args, CommandFactory, Parser, Subcommand};
use dashmap::DashMap;
use futures_util::{stream::SplitSink, SinkExt, StreamExt};
use nanoid::nanoid;
use redis::{aio::PubSub, Client, ConnectionAddr, ConnectionInfo, RedisConnectionInfo, Value};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value as JsonValue};
use sysinfo::{Pid, ProcessesToUpdate, System};
use tokio::{
    fs,
    io::AsyncWriteExt,
    net::TcpListener,
    sync::{Mutex, OnceCell},
    task::JoinHandle,
};
use url::Url;

#[derive(Parser, Debug)]
#[command(
    name = "rds",
    version,
    about = "This is a lightweight Redis Manager.",
    disable_help_subcommand = true
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
enum Commands {
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
struct ServerOptions {
    #[arg(long, default_value_t = 5090)]
    port: u16,
    #[arg(long, env = "RDS_ASSET_ROOT")]
    asset_root: Option<PathBuf>,
}

#[derive(Debug, Clone)]
struct AppState {
    asset_root: PathBuf,
    upload_dir: PathBuf,
    config_path: PathBuf,
    connections_dir: PathBuf,
    redis_map: Arc<RedisMap>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ConnectionData {
    host: String,
    #[serde(default)]
    username: String,
    #[serde(default)]
    password: String,
    port: u16,
    #[serde(default)]
    ca: Option<String>,
    #[serde(default)]
    key: Option<String>,
    #[serde(default)]
    cert: Option<String>,
    #[serde(default)]
    id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RequestEnvelope {
    #[serde(rename = "type")]
    request_type: String,
    #[serde(default)]
    data: JsonValue,
    #[serde(rename = "requestId")]
    request_id: String,
    #[serde(default)]
    role: Option<String>,
}

#[derive(Debug, Serialize)]
struct ResponseEnvelope {
    #[serde(rename = "type")]
    response_type: String,
    data: JsonValue,
    #[serde(rename = "requestId")]
    request_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct HttpInvokeRequest {
    method: String,
    url: String,
    #[serde(default)]
    body: JsonValue,
}

#[derive(Debug, Deserialize)]
struct RedisInvokeRequest {
    id: String,
    command: String,
    #[serde(default)]
    args: Vec<JsonValue>,
    #[serde(default)]
    role: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DisconnectBody {
    #[serde(default)]
    role: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StatusQuery {
    id: String,
}

type RedisInstanceCell = Arc<OnceCell<Arc<Client>>>;
type WebSocketSender = Arc<Mutex<SplitSink<WebSocket, Message>>>;

#[derive(Debug)]
struct RedisMap {
    instances: DashMap<String, RedisInstanceCell>,
}

impl RedisMap {
    fn new() -> Self {
        Self {
            instances: DashMap::new(),
        }
    }

    fn cache_key(config: &ConnectionData, role: &str) -> String {
        format!(
            "{}:{}:{}:{}:{}",
            config.host, config.port, config.username, config.password, role
        )
    }

    async fn get_instance(
        &self,
        config: &ConnectionData,
        role: &str,
    ) -> Result<Arc<Client>, String> {
        let key = Self::cache_key(config, role);
        let cell = self
            .instances
            .entry(key.clone())
            .or_insert_with(|| Arc::new(OnceCell::new()))
            .clone();

        let client = cell
            .get_or_try_init(|| async move { Self::create_connection(config).await })
            .await
            .map_err(|error| error.to_string())?;

        Ok(client.clone())
    }

    async fn create_connection(config: &ConnectionData) -> Result<Arc<Client>, redis::RedisError> {
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
            username: if config.username.is_empty() {
                None
            } else {
                Some(config.username.clone())
            },
            password: if config.password.is_empty() {
                None
            } else {
                Some(config.password.clone())
            },
            protocol: redis::ProtocolVersion::RESP2,
        };

        let client = Client::open(ConnectionInfo { addr, redis })?;
        Ok(Arc::new(client))
    }

    fn remove_instance(&self, config: &ConnectionData, role: &str) {
        self.instances.remove(&Self::cache_key(config, role));
    }
}

#[tokio::main]
async fn main() {
    if let Err(error) = async_main().await {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

async fn async_main() -> Result<(), String> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Start(options)) => start_background_server(options).await,
        Some(Commands::Stop) => stop_background_server().await,
        Some(Commands::Restart(options)) => {
            stop_background_server().await?;
            start_background_server(options).await
        }
        Some(Commands::Status) => {
            print_status().await;
            Ok(())
        }
        Some(Commands::Serve(options)) => run_server(options).await,
        None => {
            let mut command = Cli::command();
            command.print_help().map_err(|error| error.to_string())?;
            println!();
            Ok(())
        }
    }
}

async fn start_background_server(options: ServerOptions) -> Result<(), String> {
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

async fn stop_background_server() -> Result<(), String> {
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

async fn print_status() {
    match pid_file_path() {
        Ok(pid_path) => match read_pid(&pid_path).await {
            Ok(Some(pid)) if process_exists(pid) => println!("✔ Running"),
            _ => println!("✖ Not Running"),
        },
        Err(_) => println!("✖ Not Running"),
    }
}

async fn run_server(options: ServerOptions) -> Result<(), String> {
    let asset_root = resolve_asset_root(options.asset_root)?;
    let cache_root = cache_root()?;
    let upload_dir = cache_root.join("uploads");
    let config_path = cache_root.join("config.json");
    let connections_dir = cache_root.join("db").join("connections");

    fs::create_dir_all(&upload_dir)
        .await
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&connections_dir)
        .await
        .map_err(|error| error.to_string())?;

    let state = Arc::new(AppState {
        asset_root,
        upload_dir,
        config_path,
        connections_dir,
        redis_map: Arc::new(RedisMap::new()),
    });

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/upload", post(upload_handler))
        .route(
            "/api/connections",
            get(get_connections).post(create_connection),
        )
        .route(
            "/api/connections/{id}",
            put(update_connection).delete(delete_connection),
        )
        .route(
            "/api/connections/status",
            get(get_connection_status_handler),
        )
        .route(
            "/api/connections/{id}/disconnect",
            post(disconnect_connection),
        )
        .route("/api/config", get(get_config).post(set_config))
        .route("/favicon.png", get(favicon_handler))
        .route("/assets/{*path}", get(asset_handler))
        .fallback(get(index_handler))
        .with_state(state);

    let address = format!("127.0.0.1:{}", options.port);
    let listener = TcpListener::bind(&address)
        .await
        .map_err(|error| error.to_string())?;

    println!("🚀 The server is running at http://{address}");
    axum::serve(listener, app)
        .await
        .map_err(|error| error.to_string())
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<Arc<AppState>>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        handle_socket(socket, state).await;
    })
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (sender, mut receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));
    let subscriptions = Arc::new(Mutex::new(HashMap::<String, JoinHandle<()>>::new()));

    while let Some(message_result) = receiver.next().await {
        let message = match message_result {
            Ok(message) => message,
            Err(error) => {
                eprintln!("websocket receive error: {error}");
                break;
            }
        };

        let Message::Text(payload) = message else {
            continue;
        };

        let parsed = serde_json::from_str::<RequestEnvelope>(&payload);
        let request = match parsed {
            Ok(request) => request,
            Err(error) => {
                let _ = send_ws_json(
                    &sender,
                    &ResponseEnvelope {
                        response_type: "error".to_string(),
                        data: JsonValue::String(error.to_string()),
                        request_id: "unknown".to_string(),
                        code: Some(-1),
                    },
                )
                .await;
                continue;
            }
        };

        let request_type = request.request_type.clone();
        let request_id = request.request_id.clone();

        let response = match request_type.as_str() {
            "sendRequest" => handle_http_invoke(&state, request).await,
            "sendCommand" => handle_redis_invoke(&state, &sender, &subscriptions, request).await,
            _ => Ok(ResponseEnvelope {
                response_type: request_type.clone(),
                data: JsonValue::Null,
                request_id: request_id.clone(),
                code: None,
            }),
        };

        match response {
            Ok(envelope) => {
                if let Err(error) = send_ws_json(&sender, &envelope).await {
                    eprintln!("websocket send error: {error}");
                    break;
                }
            }
            Err(error) => {
                let _ = send_ws_json(
                    &sender,
                    &ResponseEnvelope {
                        response_type: request_type,
                        data: JsonValue::String(error),
                        request_id,
                        code: Some(-1),
                    },
                )
                .await;
            }
        }
    }

    let mut active = subscriptions.lock().await;
    for (_, handle) in active.drain() {
        handle.abort();
    }
}

async fn handle_http_invoke(
    state: &Arc<AppState>,
    request: RequestEnvelope,
) -> Result<ResponseEnvelope, String> {
    let invoke = serde_json::from_value::<HttpInvokeRequest>(request.data)
        .map_err(|error| error.to_string())?;
    let data = route_api_request(state, invoke).await?;
    Ok(ResponseEnvelope {
        response_type: request.request_type,
        data,
        request_id: request.request_id,
        code: None,
    })
}

async fn handle_redis_invoke(
    state: &Arc<AppState>,
    sender: &WebSocketSender,
    subscriptions: &Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
    request: RequestEnvelope,
) -> Result<ResponseEnvelope, String> {
    let invoke = serde_json::from_value::<RedisInvokeRequest>(request.data)
        .map_err(|error| error.to_string())?;
    let role = invoke
        .role
        .clone()
        .or(request.role.clone())
        .unwrap_or_else(|| "publisher".to_string());
    let connection = find_connection(&state.connections_dir, &invoke.id)
        .await?
        .ok_or_else(|| format!("No connection found with ID: {}", invoke.id))?;

    let data = match invoke.command.to_uppercase().as_str() {
        "PSUBSCRIBE" => {
            let pattern = invoke
                .args
                .first()
                .and_then(JsonValue::as_str)
                .ok_or_else(|| "PSUBSCRIBE requires a pattern".to_string())?
                .to_string();
            start_pubsub_task(
                state.clone(),
                sender.clone(),
                subscriptions.clone(),
                connection,
                role,
                pattern,
            )
            .await?;
            JsonValue::Null
        }
        "PUNSUBSCRIBE" => {
            let pattern = invoke
                .args
                .first()
                .and_then(JsonValue::as_str)
                .ok_or_else(|| "PUNSUBSCRIBE requires a pattern".to_string())?
                .to_string();
            stop_pubsub_task(subscriptions.clone(), &invoke.id, &pattern).await;
            state.redis_map.remove_instance(&connection, &role);
            JsonValue::Null
        }
        _ => {
            execute_redis_command(
                state.redis_map.clone(),
                &connection,
                &role,
                &invoke.command,
                &invoke.args,
            )
            .await?
        }
    };

    Ok(ResponseEnvelope {
        response_type: request.request_type,
        data,
        request_id: request.request_id,
        code: None,
    })
}

async fn send_ws_json(sender: &WebSocketSender, payload: &ResponseEnvelope) -> Result<(), String> {
    let message = serde_json::to_string(payload).map_err(|error| error.to_string())?;
    sender
        .lock()
        .await
        .send(Message::Text(message.into()))
        .await
        .map_err(|error| error.to_string())
}

async fn route_api_request(
    state: &AppState,
    invoke: HttpInvokeRequest,
) -> Result<JsonValue, String> {
    let method = invoke.method.to_uppercase();
    let url = Url::parse(&format!("http://localhost{}", invoke.url))
        .map_err(|error| error.to_string())?;
    let segments: Vec<&str> = url
        .path()
        .trim_matches('/')
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect();

    match (method.as_str(), segments.as_slice()) {
        ("GET", ["api", "connections"]) => list_connections(&state.connections_dir).await,
        ("GET", ["api", "connections", "status"]) => {
            let id = url
                .query_pairs()
                .find(|(key, _)| key == "id")
                .map(|(_, value)| value.to_string())
                .ok_or_else(|| "missing query parameter: id".to_string())?;
            let Some(connection) = find_connection(&state.connections_dir, &id).await? else {
                return Ok(json!(-1));
            };
            match execute_redis_command(
                state.redis_map.clone(),
                &connection,
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
        ("POST", ["api", "connections"]) => {
            create_connection_record(&state.connections_dir, invoke.body).await
        }
        ("PUT", ["api", "connections", id]) => {
            update_connection_record(&state.connections_dir, id, invoke.body).await
        }
        ("DELETE", ["api", "connections", id]) => {
            delete_connection_record(&state.connections_dir, id).await?;
            Ok(JsonValue::Null)
        }
        ("POST", ["api", "connections", id, "disconnect"]) => {
            let role = invoke
                .body
                .get("role")
                .and_then(JsonValue::as_str)
                .unwrap_or("publisher");
            if let Some(connection) = find_connection(&state.connections_dir, id).await? {
                state.redis_map.remove_instance(&connection, role);
            }
            Ok(JsonValue::Null)
        }
        ("GET", ["api", "config"]) => get_config_value(&state.config_path).await,
        ("POST", ["api", "config"]) => {
            set_config_value(&state.config_path, invoke.body).await?;
            Ok(JsonValue::Null)
        }
        _ => Ok(JsonValue::Null),
    }
}

async fn start_pubsub_task(
    state: Arc<AppState>,
    sender: WebSocketSender,
    subscriptions: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
    connection: ConnectionData,
    role: String,
    pattern: String,
) -> Result<(), String> {
    let subscription_key = format!("{}:{}", connection.id.clone().unwrap_or_default(), pattern);
    stop_pubsub_task(
        subscriptions.clone(),
        connection.id.as_deref().unwrap_or_default(),
        &pattern,
    )
    .await;

    let client = state.redis_map.get_instance(&connection, &role).await?;
    let mut pubsub = open_pubsub(client.clone()).await?;
    pubsub
        .psubscribe(pattern.clone())
        .await
        .map_err(|error| error.to_string())?;

    let handle = tokio::spawn(async move {
        let mut stream = pubsub.on_message();
        while let Some(message) = stream.next().await {
            let channel = message.get_channel_name().to_string();
            let payload = message
                .get_payload::<String>()
                .unwrap_or_else(|_| String::new());
            let pattern_value = message.get_pattern::<String>().unwrap_or_default();
            let envelope = ResponseEnvelope {
                response_type: "onRedisMessage".to_string(),
                data: JsonValue::String(
                    json!({
                      "pattern": pattern_value,
                      "channel": channel,
                      "message": payload,
                    })
                    .to_string(),
                ),
                request_id: "RedisPubSubRequestId".to_string(),
                code: None,
            };

            if send_ws_json(&sender, &envelope).await.is_err() {
                break;
            }
        }
    });

    subscriptions.lock().await.insert(subscription_key, handle);
    Ok(())
}

async fn stop_pubsub_task(
    subscriptions: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
    connection_id: &str,
    pattern: &str,
) {
    let key = format!("{connection_id}:{pattern}");
    if let Some(handle) = subscriptions.lock().await.remove(&key) {
        handle.abort();
    }
}

async fn open_pubsub(client: Arc<Client>) -> Result<PubSub, String> {
    client
        .get_async_pubsub()
        .await
        .map_err(|error| error.to_string())
}

async fn execute_redis_command(
    redis_map: Arc<RedisMap>,
    connection: &ConnectionData,
    role: &str,
    command: &str,
    args: &[JsonValue],
) -> Result<JsonValue, String> {
    let client = redis_map.get_instance(connection, role).await?;
    let mut multiplexed = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|error| error.to_string())?;

    let mut cmd = redis::cmd(command);
    for argument in args {
        match argument {
            JsonValue::Null => cmd.arg(""),
            JsonValue::Bool(value) => cmd.arg(value.to_string()),
            JsonValue::Number(value) => cmd.arg(value.to_string()),
            JsonValue::String(value) => cmd.arg(value),
            _ => cmd.arg(argument.to_string()),
        };
    }

    let value: Value = cmd
        .query_async(&mut multiplexed)
        .await
        .map_err(|error| error.to_string())?;

    Ok(parse_redis_value(value))
}

fn parse_redis_value(value: Value) -> JsonValue {
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

async fn get_connections(State(state): State<Arc<AppState>>) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        list_connections(&state.connections_dir)
            .await
            .map_err(AppError::from)?,
    ))
}

async fn create_connection(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<JsonValue>,
) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        create_connection_record(&state.connections_dir, payload)
            .await
            .map_err(AppError::from)?,
    ))
}

async fn update_connection(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<String>,
    Json(payload): Json<JsonValue>,
) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        update_connection_record(&state.connections_dir, &id, payload)
            .await
            .map_err(AppError::from)?,
    ))
}

async fn delete_connection(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<String>,
) -> Result<StatusCode, AppError> {
    delete_connection_record(&state.connections_dir, &id)
        .await
        .map_err(AppError::from)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn get_connection_status_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<StatusQuery>,
) -> Result<Json<JsonValue>, AppError> {
    let value = route_api_request(
        &state,
        HttpInvokeRequest {
            method: Method::GET.as_str().to_string(),
            url: format!("/api/connections/status?id={}", query.id),
            body: JsonValue::Null,
        },
    )
    .await
    .map_err(AppError::from)?;
    Ok(Json(value))
}

async fn disconnect_connection(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<String>,
    Json(body): Json<DisconnectBody>,
) -> Result<Json<JsonValue>, AppError> {
    let payload = json!({ "role": body.role });
    let value = route_api_request(
        &state,
        HttpInvokeRequest {
            method: Method::POST.as_str().to_string(),
            url: format!("/api/connections/{id}/disconnect"),
            body: payload,
        },
    )
    .await
    .map_err(AppError::from)?;
    Ok(Json(value))
}

async fn get_config(State(state): State<Arc<AppState>>) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        get_config_value(&state.config_path)
            .await
            .map_err(AppError::from)?,
    ))
}

async fn set_config(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<JsonValue>,
) -> Result<StatusCode, AppError> {
    set_config_value(&state.config_path, payload)
        .await
        .map_err(AppError::from)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn upload_handler(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<Json<JsonValue>, AppError> {
    fs::create_dir_all(&state.upload_dir)
        .await
        .map_err(AppError::from)?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|error| AppError::new(StatusCode::BAD_REQUEST, error.to_string()))?
    {
        if field.name() != Some("file") {
            continue;
        }

        let file_name = field
            .file_name()
            .map(sanitize_file_name)
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| format!("upload-{}", nanoid!(8)));
        let file_path = state.upload_dir.join(&file_name);
        let data = field
            .bytes()
            .await
            .map_err(|error| AppError::new(StatusCode::BAD_REQUEST, error.to_string()))?;
        let mut file = fs::File::create(&file_path).await.map_err(AppError::from)?;
        file.write_all(&data).await.map_err(AppError::from)?;

        return Ok(Json(json!({
          "url": file_path.to_string_lossy().to_string()
        })));
    }

    Err(AppError::new(StatusCode::NOT_FOUND, "Not Found"))
}

async fn favicon_handler(State(state): State<Arc<AppState>>) -> Result<Response, AppError> {
    serve_file_response(state.asset_root.join("favicon.png")).await
}

async fn asset_handler(
    State(state): State<Arc<AppState>>,
    AxumPath(path): AxumPath<String>,
) -> Result<Response, AppError> {
    let candidate = safe_join(&state.asset_root.join("assets"), &path)?;
    serve_file_response(candidate).await
}

async fn index_handler(State(state): State<Arc<AppState>>) -> Result<Html<String>, AppError> {
    let html = fs::read_to_string(state.asset_root.join("index.html"))
        .await
        .map_err(AppError::from)?;
    Ok(Html(html))
}

async fn serve_file_response(path: PathBuf) -> Result<Response, AppError> {
    let data = fs::read(&path).await.map_err(AppError::from)?;
    let mime = mime_guess::from_path(&path).first_or_octet_stream();
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(mime.as_ref())
            .map_err(|error| AppError::new(StatusCode::INTERNAL_SERVER_ERROR, error.to_string()))?,
    );
    Ok((StatusCode::OK, headers, Body::from(data)).into_response())
}

async fn list_connections(connections_dir: &Path) -> Result<JsonValue, String> {
    fs::create_dir_all(connections_dir)
        .await
        .map_err(|error| error.to_string())?;

    let mut entries = fs::read_dir(connections_dir)
        .await
        .map_err(|error| error.to_string())?;
    let mut connections = Vec::new();

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
        if let Some(connection) = find_connection(connections_dir, id).await? {
            connections.push(serde_json::to_value(connection).map_err(|error| error.to_string())?);
        }
    }

    Ok(JsonValue::Array(connections))
}

async fn find_connection(
    connections_dir: &Path,
    id: &str,
) -> Result<Option<ConnectionData>, String> {
    let path = connection_file_path(connections_dir, id)?;
    let content = match fs::read_to_string(&path).await {
        Ok(content) => content,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    let mut connection =
        serde_json::from_str::<ConnectionData>(&content).map_err(|error| error.to_string())?;
    connection.id = Some(id.to_string());
    Ok(Some(connection))
}

async fn create_connection_record(
    connections_dir: &Path,
    payload: JsonValue,
) -> Result<JsonValue, String> {
    fs::create_dir_all(connections_dir)
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
        .ok_or_else(|| "connection payload must be an object".to_string())?;
    object.remove("id");

    let serialized =
        serde_json::to_vec_pretty(&JsonValue::Object(object)).map_err(|error| error.to_string())?;
    fs::write(connection_file_path(connections_dir, &id)?, serialized)
        .await
        .map_err(|error| error.to_string())?;
    Ok(JsonValue::String(id))
}

async fn update_connection_record(
    connections_dir: &Path,
    id: &str,
    payload: JsonValue,
) -> Result<JsonValue, String> {
    let path = connection_file_path(connections_dir, id)?;
    let current = match fs::read_to_string(&path).await {
        Ok(content) => serde_json::from_str::<JsonValue>(&content).unwrap_or_else(|_| json!({})),
        Err(error) if error.kind() == io::ErrorKind::NotFound => json!({}),
        Err(error) => return Err(error.to_string()),
    };

    let merged = merge_json_objects(current, payload)?;
    let object = merged
        .as_object()
        .cloned()
        .ok_or_else(|| "connection payload must be an object".to_string())?;

    fs::write(
        path,
        serde_json::to_vec_pretty(&JsonValue::Object(object)).map_err(|error| error.to_string())?,
    )
    .await
    .map_err(|error| error.to_string())?;

    Ok(JsonValue::Null)
}

async fn delete_connection_record(connections_dir: &Path, id: &str) -> Result<(), String> {
    let path = connection_file_path(connections_dir, id)?;
    match fs::remove_file(path).await {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

async fn get_config_value(config_path: &Path) -> Result<JsonValue, String> {
    match fs::read_to_string(config_path).await {
        Ok(content) => serde_json::from_str(&content).map_err(|error| error.to_string()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(JsonValue::Null),
        Err(error) => Err(error.to_string()),
    }
}

async fn set_config_value(config_path: &Path, payload: JsonValue) -> Result<(), String> {
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

fn merge_json_objects(current: JsonValue, next: JsonValue) -> Result<JsonValue, String> {
    let mut current_object = current.as_object().cloned().unwrap_or_else(Map::new);
    let next_object = next
        .as_object()
        .cloned()
        .ok_or_else(|| "connection payload must be an object".to_string())?;

    for (key, value) in next_object {
        if key == "id" {
            continue;
        }
        current_object.insert(key, value);
    }

    Ok(JsonValue::Object(current_object))
}

fn sanitize_file_name(file_name: &str) -> String {
    file_name
        .chars()
        .filter(|character| !matches!(character, '/' | '\\' | '\0'))
        .collect::<String>()
}

async fn safe_read_file(path: &Option<String>) -> Option<Vec<u8>> {
    let Some(path) = path else {
        return None;
    };
    fs::read(path).await.ok()
}

fn safe_join(base: &Path, request_path: &str) -> Result<PathBuf, AppError> {
    let mut candidate = base.to_path_buf();
    for segment in request_path.split('/') {
        if segment.is_empty() || segment == "." {
            continue;
        }
        if segment == ".." {
            return Err(AppError::new(StatusCode::NOT_FOUND, "Not Found"));
        }
        candidate.push(segment);
    }
    Ok(candidate)
}

async fn ensure_cache_layout() -> Result<(), String> {
    let root = cache_root()?;
    fs::create_dir_all(root.join("db").join("connections"))
        .await
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(root.join("uploads"))
        .await
        .map_err(|error| error.to_string())
}

fn cache_root() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|path| path.join(".redis-studio-cache"))
        .ok_or_else(|| "failed to resolve home directory".to_string())
}

fn pid_file_path() -> Result<PathBuf, String> {
    Ok(cache_root()?.join("rs-server.pid"))
}

async fn read_pid(path: &Path) -> Result<Option<u32>, String> {
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

async fn write_pid(path: &Path, pid: u32) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|error| error.to_string())?;
    }
    fs::write(path, pid.to_string())
        .await
        .map_err(|error| error.to_string())
}

fn process_exists(pid: u32) -> bool {
    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);
    system.process(Pid::from_u32(pid)).is_some()
}

fn detach_command(command: &mut Command) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            command.pre_exec(|| {
                if libc::setsid() == -1 {
                    return Err(io::Error::last_os_error());
                }
                Ok(())
            });
        }
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const DETACHED_PROCESS: u32 = 0x0000_0008;
        const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;
        command.creation_flags(DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
    }

    Ok(())
}

fn terminate_process(pid: u32) -> Result<(), String> {
    #[cfg(unix)]
    {
        let result = unsafe { libc::kill(pid as i32, libc::SIGTERM) };
        if result == 0 {
            return Ok(());
        }
        return Err(io::Error::last_os_error().to_string());
    }

    #[cfg(windows)]
    {
        let status = Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .status()
            .map_err(|error| error.to_string())?;
        if status.success() {
            return Ok(());
        }
        return Err(format!("taskkill exited with status {status}"));
    }
}

fn resolve_asset_root(input: Option<PathBuf>) -> Result<PathBuf, String> {
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

fn print_banner(text: &str) {
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

fn connection_file_path(connections_dir: &Path, id: &str) -> Result<PathBuf, String> {
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("invalid connection id".to_string());
    }
    Ok(connections_dir.join(format!("{id}.json")))
}

#[derive(Debug)]
struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }
}

impl From<String> for AppError {
    fn from(value: String) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, value)
    }
}

impl From<io::Error> for AppError {
    fn from(value: io::Error) -> Self {
        let status = if value.kind() == io::ErrorKind::NotFound {
            StatusCode::NOT_FOUND
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };
        Self::new(status, value.to_string())
    }
}

impl From<axum::Error> for AppError {
    fn from(value: axum::Error) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, value.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}
