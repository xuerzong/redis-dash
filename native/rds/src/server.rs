use std::{collections::HashMap, path::{Path, PathBuf}, sync::Arc};

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
use futures_util::{SinkExt, StreamExt};
use nanoid::nanoid;
use rds_core::{
    create_json_record, delete_json_record, execute_redis_command, find_json_record,
    get_json_config, list_json_records, open_redis_pubsub, set_json_config, update_json_record,
    RedisMap,
};
use serde_json::{json, Value as JsonValue};
use tokio::{fs, io::AsyncWriteExt, net::TcpListener, sync::Mutex, task::JoinHandle};
use url::Url;

use crate::{
    error::AppError,
    models::{
        AppState, ConnectionData, DisconnectBody, HttpInvokeRequest, RedisInvokeRequest,
        RequestEnvelope, ResponseEnvelope, ServerOptions, StatusQuery, WebSocketSender,
    },
    paths::{cache_root, ensure_cache_layout, resolve_asset_root},
};

pub(crate) async fn run_server(options: ServerOptions) -> Result<(), String> {
    let asset_root = resolve_asset_root(options.asset_root)?;
    ensure_cache_layout().await?;
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

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
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
            state
                .redis_map
                .remove_instance_with_role(&connection.redis_config(), &role);
            JsonValue::Null
        }
        _ => {
            execute_redis_command(
                state.redis_map.clone(),
                &connection.redis_config(),
                &role,
                &invoke.command,
                &redis_args(&invoke.args),
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
        ("POST", ["api", "connections"]) => create_json_record(&state.connections_dir, invoke.body)
            .await
            .map(JsonValue::String),
        ("PUT", ["api", "connections", id]) => {
            update_json_record(&state.connections_dir, id, invoke.body)
                .await
                .map(|()| JsonValue::Null)
        }
        ("DELETE", ["api", "connections", id]) => {
            delete_json_record(&state.connections_dir, id).await?;
            Ok(JsonValue::Null)
        }
        ("POST", ["api", "connections", id, "disconnect"]) => {
            let role = invoke
                .body
                .get("role")
                .and_then(JsonValue::as_str)
                .unwrap_or("publisher");
            if let Some(connection) = find_connection(&state.connections_dir, id).await? {
                state
                    .redis_map
                    .remove_instance_with_role(&connection.redis_config(), role);
            }
            Ok(JsonValue::Null)
        }
        ("GET", ["api", "config"]) => get_json_config(&state.config_path).await,
        ("POST", ["api", "config"]) => {
            set_json_config(&state.config_path, invoke.body).await?;
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

    let mut pubsub =
        open_redis_pubsub(state.redis_map.clone(), &connection.redis_config(), &role).await?;
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
        create_json_record(&state.connections_dir, payload)
            .await
            .map(JsonValue::String)
            .map_err(AppError::from)?,
    ))
}

async fn update_connection(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<String>,
    Json(payload): Json<JsonValue>,
) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        update_json_record(&state.connections_dir, &id, payload)
            .await
            .map(|()| JsonValue::Null)
            .map_err(AppError::from)?,
    ))
}

async fn delete_connection(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<String>,
) -> Result<StatusCode, AppError> {
    delete_json_record(&state.connections_dir, &id)
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
        get_json_config(&state.config_path)
            .await
            .map_err(AppError::from)?,
    ))
}

async fn set_config(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<JsonValue>,
) -> Result<StatusCode, AppError> {
    set_json_config(&state.config_path, payload)
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
    let mut connections = Vec::new();

    for (id, value) in list_json_records(connections_dir).await? {
        let mut connection =
            serde_json::from_value::<ConnectionData>(value).map_err(|error| error.to_string())?;
        connection.id = Some(id);
        connections.push(serde_json::to_value(connection).map_err(|error| error.to_string())?);
    }

    Ok(JsonValue::Array(connections))
}

async fn find_connection(
    connections_dir: &Path,
    id: &str,
) -> Result<Option<ConnectionData>, String> {
    let Some(value) = find_json_record(connections_dir, id).await? else {
        return Ok(None);
    };

    let mut connection =
        serde_json::from_value::<ConnectionData>(value).map_err(|error| error.to_string())?;
    connection.id = Some(id.to_string());
    Ok(Some(connection))
}

fn sanitize_file_name(file_name: &str) -> String {
    file_name
        .chars()
        .filter(|character| !matches!(character, '/' | '\\' | '\0'))
        .collect::<String>()
}

fn redis_args(args: &[JsonValue]) -> Vec<String> {
    args.iter()
        .map(|argument| match argument {
            JsonValue::Null => String::new(),
            JsonValue::Bool(value) => value.to_string(),
            JsonValue::Number(value) => value.to_string(),
            JsonValue::String(value) => value.clone(),
            _ => argument.to_string(),
        })
        .collect()
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