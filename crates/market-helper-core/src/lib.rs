// TODO: Use units.
#![allow(dead_code)]

#[cfg(test)]
mod tests;

#[derive(Debug, Clone)]
pub struct ItemData {
    name: String,
    price: f64,
    weight: f64,
    nutrition: NutritionalTable,
}

impl ItemData {
    pub fn new(
        name: impl Into<String>,
        price: f64,
        weight: f64,
        nutrition: NutritionalTable,
    ) -> Self {
        Self {
            name: name.into(),
            price,
            weight,
            nutrition,
        }
    }

    pub fn prices(&self) -> NutritionalPrices {
        let price_per_gram = self.price / self.weight;
        self.nutrition.prices(price_per_gram)
    }
}

#[derive(Debug, Clone, Copy)]
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

#[derive(Debug, Clone, Copy)]
pub struct NutritionalPrices {
    pub calories: f64,
    pub protein: f64,
}
