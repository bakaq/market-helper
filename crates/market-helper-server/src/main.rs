#![allow(dead_code)]

use std::collections::HashSet;
use std::sync::Arc;

use anyhow::Result;
use axum::{extract::State, routing::get, Json, Router};

use market_helper_core::ItemData;
use serde_json::{json, Value};

#[derive(Debug, Clone, Default)]
struct AppState {
    // TODO: Use some kind of database
    items: HashSet<ItemData>,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/item/get", get(get_items))
        .with_state(Arc::new(AppState::default()));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn get_items(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({ "test": "example" }))
}
