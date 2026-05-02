use std::{path::Path, sync::Arc};

use axum::{
    extract::{Multipart, Path as AxumPath, Query, State},
    http::{Method, StatusCode},
    Json,
};
use nanoid::nanoid;
use rds_core::{
    create_json_record, delete_json_record, execute_redis_command, find_json_record,
    get_json_config, list_json_records, set_json_config, update_json_record,
};
use serde_json::{json, Value as JsonValue};
use tokio::{fs, io::AsyncWriteExt};
use url::Url;

use crate::{
    error::AppError,
    models::{AppState, ConnectionData, DisconnectBody, HttpInvokeRequest, StatusQuery},
};

pub(super) async fn route_api_request(
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

pub(super) async fn get_connections(
    State(state): State<Arc<AppState>>,
) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        list_connections(&state.connections_dir)
            .await
            .map_err(AppError::from)?,
    ))
}

pub(super) async fn create_connection(
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

pub(super) async fn update_connection(
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

pub(super) async fn delete_connection(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<String>,
) -> Result<StatusCode, AppError> {
    delete_json_record(&state.connections_dir, &id)
        .await
        .map_err(AppError::from)?;
    Ok(StatusCode::NO_CONTENT)
}

pub(super) async fn get_connection_status_handler(
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

pub(super) async fn disconnect_connection(
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

pub(super) async fn get_config(
    State(state): State<Arc<AppState>>,
) -> Result<Json<JsonValue>, AppError> {
    Ok(Json(
        get_json_config(&state.config_path)
            .await
            .map_err(AppError::from)?,
    ))
}

pub(super) async fn set_config(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<JsonValue>,
) -> Result<StatusCode, AppError> {
    set_json_config(&state.config_path, payload)
        .await
        .map_err(AppError::from)?;
    Ok(StatusCode::NO_CONTENT)
}

pub(super) async fn upload_handler(
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

pub(super) async fn find_connection(
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

pub(super) fn redis_args(args: &[JsonValue]) -> Vec<String> {
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

fn sanitize_file_name(file_name: &str) -> String {
    file_name
        .chars()
        .filter(|character| !matches!(character, '/' | '\\' | '\0'))
        .collect::<String>()
}