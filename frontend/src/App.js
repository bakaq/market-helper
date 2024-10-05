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
      <ItemCard itemData={item.item}/>
    </li>
  );

  return (
    <div className="item-list">
    <h1>Items</h1>
    <ul className="item-list">{itemList}</ul>
    </div>
  );
}

function ItemCard({ itemData }) {
  return (
    <div className="item-card">
      {itemData.name}
    </div>
  );
}

export default App;
