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
            protein: 39.0,
        },
    }
    .into();
    let prices = item_data.prices();

    assert_relative_eq!(prices.calories, 42.0);
    assert_relative_eq!(prices.protein, 39.0);
}
