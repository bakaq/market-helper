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
  const [showAddForm, setShowAddForm] = useState(false);

  async function getItems() {
    const response = await fetch(`${API_ROOT}/item/get_all`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const content = await response.json();
    setItems(content);
  }

  // Get the items on first render.
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
      {
        showAddForm ?
          <AddForm show={showAddForm} getItems={getItems} /> :
          <button onClick={() => setShowAddForm(true)}>Add</button>
      }
      <ul>{itemList}</ul>
    </div>
  );
}

function AddForm({ getItems }) {
  const fields = {
    name: "Name",
    weight: "Weight",
    price: "Price",
    portionWeight: "Portion weight",
    calories: "Calories",
    protein: "Protein",
  };

  const [inputs, setInputs] = useState({});

  function changeHandler(event) {
    const name = event.target.name;
    const value = event.target.value;
    setInputs(old => ({ ...old, [name]: value }));
    // Reload the list.
    getItems();
  }

  const fieldsArray = Object.entries(fields).map(([name, label]) => (
    <div key={name}>
      <label>{label}:
        <input type="text" name={name} onChange={changeHandler} />
      </label>
      <br />
    </div>
  ));

  async function submitHandler(event) {
    event.preventDefault();

    const itemDescription = {
      name: inputs.name,
      price: parseFloat(inputs.price),
      weight: parseFloat(inputs.weight),
      nutrition: {
        portion_weight: parseFloat(inputs.portionWeight),
        calories: parseFloat(inputs.calories),
        protein: parseFloat(inputs.protein),
      },
    };
    await fetch(`${API_ROOT}/item/add`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(itemDescription),
    });

    // Reload the list.
    getItems();
  }

  return (
    <div className="add-form">
      <form onSubmit={submitHandler}>
        {fieldsArray}
        <input type="submit" id="submit-add" value="Add item" />
      </form>
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
          Nutrition prices: <NutritionPrices nutritionPrices={itemData.nutrition_prices} />
        </li>
        <li>
          Nutritional table: <NutritionalTable nutrition={itemData.nutrition} />
        </li>
      </ul>
      <button>Edit (TODO)</button>
      <button>Remove (TODO)</button>
    </div>
  );
}

function NutritionalTable({ nutrition }) {
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

function NutritionPrices({ nutritionPrices }) {
  return (
    <div>
      <ul>
        <li>Calories: {nutritionPrices.calories} g/R$</li>
        <li>Protein: {nutritionPrices.protein} g/R$</li>
      </ul>
    </div>
  )
}

export default App;
