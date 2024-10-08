use crate::ItemDescription;

use super::{ItemData, NutritionalTable};
use approx::assert_relative_eq;

#[test]
fn item_data_basic() {
    let item_data: ItemData = ItemDescription {
        name: "A".into(),
        price: 1.0,
        weight: 1.0,
        nutrition: NutritionalTable {
            portion_weight: 1.0,
            calories: 42.0,
            carbohidrates: 23.0,
            protein: 39.0,
            total_fat: 123.0,
            saturated_fat: 22.0,
            fiber: 34.0,
        },
    }
    .into();
    let prices = item_data.prices();

    assert_relative_eq!(prices.calories, 42.0);
    assert_relative_eq!(prices.carbohidrates, 23.0);
    assert_relative_eq!(prices.protein, 39.0);
    assert_relative_eq!(prices.total_fat, 123.0);
    assert_relative_eq!(prices.saturated_fat, 22.0);
    assert_relative_eq!(prices.fiber, 34.0);
}
