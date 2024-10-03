// TODO: Use units.
#![allow(dead_code)]

use serde_derive::{Deserialize, Serialize};

#[cfg(test)]
mod tests;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemData {
    name: String,
    price: f64,
    weight: f64,
    nutrition: NutritionalTable,
    nutrition_prices: NutritionalPrices,
}

impl ItemData {
    pub fn new(
        name: impl Into<String>,
        price: f64,
        weight: f64,
        nutrition: NutritionalTable,
    ) -> Self {
        let price_per_gram = price / weight;
        let nutrition_prices = nutrition.prices(price_per_gram);
        Self {
            name: name.into(),
            price,
            weight,
            nutrition,
            nutrition_prices,
        }
    }

    pub fn prices(&self) -> NutritionalPrices {
        self.nutrition_prices
    }

    pub fn name(&self) -> &str {
        &self.name
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct NutritionalTable {
    pub portion_weight: f64,
    pub calories: f64,
    pub protein: f64,
}

impl NutritionalTable {
    pub fn for_weight(&self, weight: f64) -> Self {
        Self {
            portion_weight: weight,
            calories: self.calories / self.portion_weight * weight,
            protein: self.protein / self.portion_weight * weight,
        }
    }

    pub fn normalized(&self) -> Self {
        Self {
            portion_weight: 1.0,
            calories: self.calories / self.portion_weight,
            protein: self.protein / self.portion_weight,
        }
    }

    pub fn prices(&self, price_per_gram: f64) -> NutritionalPrices {
        NutritionalPrices {
            calories: self.calories / self.portion_weight * price_per_gram,
            protein: self.protein / self.portion_weight * price_per_gram,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct NutritionalPrices {
    pub calories: f64,
    pub protein: f64,
}
