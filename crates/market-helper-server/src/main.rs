#![allow(dead_code, unused_imports)]

use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use anyhow::Result;
use axum::http::StatusCode;
use axum::routing::post;
use axum::{
    extract::State,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use tokio::sync::Mutex;

use market_helper_core::{ItemData, ItemDescription, NutritionalTable};
use serde_json::{json, Value};

#[derive(Debug, Clone, Default)]
struct AppState {
    // TODO: Use some kind of database
    items: Vec<ItemData>,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let app_state = Arc::new(Mutex::new(AppState::default()));
    let app = Router::new()
        .route("/item/get_all", get(get_items))
        .route("/item/add", post(add_item))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn get_items(State(state): State<Arc<Mutex<AppState>>>) -> Result<Json<Value>, StatusCode> {
    let items = { state.lock().await.items.clone() };
    let items_json = serde_json::to_value(items).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(items_json))
}

async fn add_item(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(body): Json<Value>,
) -> Result<(), StatusCode> {
    let item_desc: ItemDescription =
        serde_json::from_value(body).map_err(|_| StatusCode::BAD_REQUEST)?;

    {
        state.lock().await.items.push(item_desc.into());
    }

    Ok(())
}
