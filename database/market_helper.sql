CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    price FLOAT NOT NULL,
    weight FLOAT NOT NULL,
    portion_weight FLOAT,
    calories FLOAT,
    protein FLOAT
);
