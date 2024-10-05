import { useState, useEffect } from 'react';

// TODO: Configure it at build-time
const API_ROOT = "http://localhost:8000";

function App() {
  return (
    <div className="app">
      <ItemList />
    </div>
  );
}

function ItemList() {
  const [items, setItems] = useState([]);

  async function getItems() {
    const response = await fetch(`${API_ROOT}/item/get_all`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const content = await response.json();
    setItems(content);
  }

  useEffect(() => {
    async function getItems() {
      const response = await fetch(`${API_ROOT}/item/get_all`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      const content = await response.json();
      setItems(content);
    }

    getItems();
  }, []);


  const itemList = items.map((item) =>
    <li key={item.id}>
      <ItemCard itemData={item.item} />
    </li>
  );

  return (
    <div className="item-list">
      <h2>Items</h2>
      <button onClick={getItems}>Reload</button>
      <ul className="item-list">{itemList}</ul>
    </div>
  );
}

function ItemCard({ itemData }) {
  return (
    <div className="item-card">
      <ul>
        <li>Name: {itemData.name}</li>
        <li>Price: R$ {itemData.price}</li>
        <li>Weight: {itemData.weight}g</li>
        <li>
          Nutritional table: <NutritionalTable nutrition={itemData.nutrition} />
        </li>
      </ul>

    </div>
  );
}

function NutritionalTable({ nutrition }) {
  console.log(nutrition);
  return (
    <div>
      <ul>
        <li>Portion weight: {nutrition.portion_weight}g</li>
        <li>Calories: {nutrition.calories}g</li>
        <li>Protein: {nutrition.protein}g</li>
      </ul>
    </div>
  )
}

export default App;
