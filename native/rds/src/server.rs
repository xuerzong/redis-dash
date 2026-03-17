mod assets;
mod http;
mod ws;

use std::sync::Arc;

use axum::{
    routing::{get, post, put},
    Router,
};
use rds_core::RedisMap;
use tokio::{fs, net::TcpListener};

use crate::{
    models::{AppState, ServerOptions},
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
        .route("/ws", get(ws::ws_handler))
        .route("/upload", post(http::upload_handler))
        .route(
            "/api/connections",
            get(http::get_connections).post(http::create_connection),
        )
        .route(
            "/api/connections/{id}",
            put(http::update_connection).delete(http::delete_connection),
        )
        .route(
            "/api/connections/status",
            get(http::get_connection_status_handler),
        )
        .route(
            "/api/connections/{id}/disconnect",
            post(http::disconnect_connection),
        )
        .route("/api/config", get(http::get_config).post(http::set_config))
        .route("/favicon.png", get(assets::favicon_handler))
        .route("/assets/{*path}", get(assets::asset_handler))
        .fallback(get(assets::index_handler))
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
