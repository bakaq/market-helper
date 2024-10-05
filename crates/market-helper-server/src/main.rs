#![allow(dead_code, unused_imports)]

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::sync::Arc;

use axum::http::StatusCode;
use axum::routing::post;
use axum::{
    extract::State,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::{ConnectOptions, Row, SqliteConnection};
use tokio::sync::Mutex;

use market_helper_core::{ItemData, ItemDescription, NutritionalTable};
use serde_json::{json, Value};

#[derive(Debug, Clone)]
struct AppState {
    database_connection: Arc<Mutex<SqliteConnection>>,
}

impl AppState {
    async fn try_new() -> anyhow::Result<Self> {
        let connection = SqliteConnectOptions::from_str("sqlite://database/market_helper.db")?
            .journal_mode(SqliteJournalMode::Wal)
            .connect()
            .await?;
        Ok(Self {
            database_connection: Arc::new(Mutex::new(connection)),
        })
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let app_state = Arc::new(AppState::try_new().await?);
    let app = Router::new()
        .route("/item/get_all", get(get_items))
        .route("/item/add", post(add_item))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn get_items(State(state): State<Arc<AppState>>) -> Result<Json<Value>, StatusCode> {
    let items_rows = {
        let mut conn = state.database_connection.lock().await;
        sqlx::query("SELECT * FROM items;")
            .fetch_all(&mut *conn)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    };

    let items: Value = items_rows
        .iter()
        .map(|row| {
            Ok(json!({
                "id": row.get::<u64,_>("id"),
                "item": serde_json::to_value(
                    ItemDescription {
                        name: row.get("name"),
                        price: row.get("price"),
                        weight: row.get("weight"),
                        nutrition: NutritionalTable {
                            portion_weight: row.get("portion_weight"),
                            calories: row.get("calories"),
                            protein: row.get("protein"),
                        },
                    }
                    .build(),
                )?,
            }))
        })
        .collect::<anyhow::Result<_>>()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let items_json = serde_json::to_value(items).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(items_json))
}

async fn add_item(
    State(state): State<Arc<AppState>>,
    Json(body): Json<Value>,
) -> Result<(), StatusCode> {
    let item_desc: ItemDescription =
        serde_json::from_value(body).map_err(|_| StatusCode::BAD_REQUEST)?;

    let mut conn = state.database_connection.lock().await;
    sqlx::query("INSERT INTO items VALUES (NULL, $1, $2, $3, $4, $5, $6);")
        .bind(item_desc.name)
        .bind(item_desc.price)
        .bind(item_desc.weight)
        .bind(item_desc.nutrition.portion_weight)
        .bind(item_desc.nutrition.calories)
        .bind(item_desc.nutrition.protein)
        .execute(&mut *conn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}
