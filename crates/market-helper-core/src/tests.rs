use super::{ItemData, NutritionalTable};
use approx::assert_relative_eq;

#[test]
fn item_data_basic() {
    let item_data = ItemData::new(
        "A",
        1.0,
        1.0,
        NutritionalTable {
            portion_weight: 1.0,
            calories: 42.0,
            protein: 39.0,
        },
    );
    let prices = item_data.prices();

    assert_relative_eq!(prices.calories, 42.0);
    assert_relative_eq!(prices.protein, 39.0);
}
