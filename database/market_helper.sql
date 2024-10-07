CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    price FLOAT NOT NULL,
    weight FLOAT NOT NULL,
    portion_weight FLOAT NOT NULL,
    calories FLOAT NOT NULL,
    carbohidrates FLOAT NOT NULL,
    protein FLOAT NOT NULL,
    total_fat FLOAT NOT NULL,
    saturated_fat FLOAT NOT NULL,
    fiber FLOAT NOT NULL
);
