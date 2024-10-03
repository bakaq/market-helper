#![allow(dead_code, unused_imports)]

use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use anyhow::Result;
use axum::{
    extract::State,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use tokio::sync::Mutex;

use market_helper_core::{ItemData, NutritionalTable};
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
    {
        app_state.lock().await.items.push(ItemData::new(
            "Test item",
            3.69,
            120.0,
            NutritionalTable {
                portion_weight: 100.0,
                calories: 300.0,
                protein: 20.0,
            },
        ));
    }

    let app = Router::new()
        .route("/item/get", get(get_items))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn get_items(State(state): State<Arc<Mutex<AppState>>>) -> impl IntoResponse {
    let items = state.lock().await.items.clone();
    Json(serde_json::to_value(items).unwrap())
}
