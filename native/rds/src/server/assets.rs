use std::path::{Path, PathBuf};

use axum::{
    body::Body,
    extract::{Path as AxumPath, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Response},
};
use tokio::fs;

use crate::{error::AppError, models::AppState};

pub(super) async fn favicon_handler(
    State(state): State<std::sync::Arc<AppState>>,
) -> Result<Response, AppError> {
    serve_file_response(state.asset_root.join("favicon.png")).await
}

pub(super) async fn asset_handler(
    State(state): State<std::sync::Arc<AppState>>,
    AxumPath(path): AxumPath<String>,
) -> Result<Response, AppError> {
    let candidate = safe_join(&state.asset_root.join("assets"), &path)?;
    serve_file_response(candidate).await
}

pub(super) async fn index_handler(
    State(state): State<std::sync::Arc<AppState>>,
) -> Result<Html<String>, AppError> {
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