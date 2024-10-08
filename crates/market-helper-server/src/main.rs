#![allow(dead_code, unused_imports)]

use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::sync::Arc;

use axum::http::{Method, StatusCode};
use axum::routing::post;
use axum::{
    extract::State,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::{ConnectOptions, Row, SqliteConnection};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};

use market_helper_core::{ItemData, ItemDescription, NutritionalTable};
use serde_json::{json, Value};
use tower_http::trace::TraceLayer;

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
    // TODO: Use the right HTTP methods.

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any);

    let app = Router::new()
        .route("/item/get_all", get(get_items))
        .route("/item/add", post(add_item))
        .route("/item/remove", post(remove_item))
        .route("/item/update", post(update_item))
        .with_state(app_state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn get_items(State(state): State<Arc<AppState>>) -> Result<Json<Value>, StatusCode> {
    let items_rows = {
        let mut conn = state.database_connection.lock().await;
        sqlx::query("SELECT * FROM items;")
            .fetch_all(&mut *conn)
            .await
            .inspect_err(|x| tracing::info!("{:?}", x))
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
                            carbohidrates: row.get("carbohidrates"),
                            protein: row.get("protein"),
                            total_fat: row.get("total_fat"),
                            saturated_fat: row.get("saturated_fat"),
                            fiber: row.get("fiber"),
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
    let query = r#"
        INSERT INTO items
        VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    "#;
    sqlx::query(query)
        .bind(item_desc.name)
        .bind(item_desc.price)
        .bind(item_desc.weight)
        .bind(item_desc.nutrition.portion_weight)
        .bind(item_desc.nutrition.calories)
        .bind(item_desc.nutrition.carbohidrates)
        .bind(item_desc.nutrition.protein)
        .bind(item_desc.nutrition.total_fat)
        .bind(item_desc.nutrition.saturated_fat)
        .bind(item_desc.nutrition.fiber)
        .execute(&mut *conn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RemoveRequest {
    id: i64,
}

async fn remove_item(
    State(state): State<Arc<AppState>>,
    Json(body): Json<Value>,
) -> Result<(), StatusCode> {
    let request: RemoveRequest =
        serde_json::from_value(body).map_err(|_| StatusCode::BAD_REQUEST)?;

    let mut conn = state.database_connection.lock().await;
    sqlx::query("DELETE FROM items WHERE id = $1;")
        .bind(request.id)
        .execute(&mut *conn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct UpdateRequest {
    id: i64,
    new_item: ItemDescription,
}

async fn update_item(
    State(state): State<Arc<AppState>>,
    Json(body): Json<Value>,
) -> Result<(), StatusCode> {
    let request: UpdateRequest =
        serde_json::from_value(body).map_err(|_| StatusCode::BAD_REQUEST)?;

    let mut conn = state.database_connection.lock().await;
    let query_str = r#"
        UPDATE items
        SET
            name = $1,
            price = $2,
            weight = $3,
            portion_weight = $4,
            calories = $5,
            carbohidrates = $6,
            protein = $7,
            total_fat = $8,
            saturated_fat = $9,
            fiber = $10
        WHERE id = $11;
    "#;
    sqlx::query(query_str)
        .bind(request.new_item.name)
        .bind(request.new_item.price)
        .bind(request.new_item.weight)
        .bind(request.new_item.nutrition.portion_weight)
        .bind(request.new_item.nutrition.calories)
        .bind(request.new_item.nutrition.carbohidrates)
        .bind(request.new_item.nutrition.protein)
        .bind(request.new_item.nutrition.total_fat)
        .bind(request.new_item.nutrition.saturated_fat)
        .bind(request.new_item.nutrition.fiber)
        .bind(request.id)
        .execute(&mut *conn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}
