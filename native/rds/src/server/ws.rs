use std::{collections::HashMap, sync::Arc};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use rds_core::{execute_redis_command, open_redis_pubsub};
use serde_json::{json, Value as JsonValue};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::models::{
    AppState, ConnectionData, RedisInvokeRequest, RequestEnvelope, ResponseEnvelope,
    WebSocketSender,
};

use super::http::{find_connection, redis_args, route_api_request};

pub(super) async fn ws_handler(
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
    let invoke = serde_json::from_value(request.data).map_err(|error| error.to_string())?;
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
