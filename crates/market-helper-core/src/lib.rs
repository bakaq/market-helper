// TODO: Use units.
#![allow(dead_code)]

use serde_derive::{Deserialize, Serialize};

#[cfg(test)]
mod tests;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemDescription {
    pub name: String,
    pub price: f64,
    pub weight: f64,
    pub nutrition: NutritionalTable,
}

impl ItemDescription {
    pub fn build(self) -> ItemData {
        self.into()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemData {
    pub name: String,
    pub price: f64,
    pub weight: f64,
    pub nutrition: NutritionalTable,
    pub nutrition_prices: NutritionalPrices,
}

impl ItemData {
    pub fn prices(&self) -> NutritionalPrices {
        self.nutrition_prices
    }

    pub fn name(&self) -> &str {
        &self.name
    }
}

impl From<ItemDescription> for ItemData {
    fn from(value: ItemDescription) -> Self {
        let price_per_gram = value.price / value.weight;
        let nutrition_prices = value.nutrition.prices(price_per_gram);
        Self {
            name: value.name,
            price: value.price,
            weight: value.weight,
            nutrition: value.nutrition,
            nutrition_prices,
        }
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
