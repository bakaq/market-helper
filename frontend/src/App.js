import { useState, useEffect } from 'react';

// TODO: Configure it at build-time
function api_root() {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
}

const PRECISION = 3;

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
    const response = await fetch(`${api_root()}/item/get_all`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const content = await response.json();
    setItems(content);
  }

  // Get the items on first render.
  useEffect(() => { getItems(); }, []);

  const itemList = items.map((item) =>
    <li key={item.id}>
      <ItemCard itemId={item.id} itemData={item.item} getItems={getItems} />
    </li>
  );

  return (
    <div className="item-list">
      <div className="item-list-header">
        <h2>Items</h2>
        <div>
          <button onClick={getItems}>Reload</button>
          {showAddForm || <button onClick={() => setShowAddForm(true)}>Add</button>}
        </div>
      </div>
      {showAddForm && <AddForm setShow={setShowAddForm} getItems={getItems} />}
      <ul>{itemList}</ul>
    </div>
  );
}

function AddForm({ setShow, getItems }) {
  // TODO: Validation.
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
    <div key={name} className="field">
      <label htmlFor={`add-${name}`}>{label}:</label>
      <input type="text" id={`add-${name}`} name={name} onChange={changeHandler} />
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
    await fetch(`${api_root()}/item/add`, {
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
    <form className="add-form" onSubmit={submitHandler}>
      <h3>Add item</h3>
      <div className="add-form-fields">
        {fieldsArray}
      </div>
      <div className="add-form-footer">
        <input type="submit" id="submit-add" value="Add item" />
        <button onClick={() => setShow(false)}>Cancel</button>
      </div>
    </form>
  );
}

function ItemCard({ itemId, itemData, getItems }) {
  async function removeItem() {
    if (window.confirm(`Do you really want to delete ${itemData.name}?`)) {
      await fetch(`${api_root()}/item/remove`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({id: parseInt(itemId)}),
      });
      getItems();
    }
  }
  return (
    <div className="item-card">
      <div className="item-card-header">
        <h3>{itemData.name}</h3>
        <div className="item-price">R$ {itemData.price.toFixed(2)}</div>
        <div className="item-weight">{itemData.weight.toPrecision(PRECISION)}g</div>
      </div>
      <NutritionalTable nutrition={itemData.nutrition} nutritionPrices={itemData.nutrition_prices} />
      <div className="item-card-footer">
        <button>Edit (TODO)</button>
        <button onClick={() => { removeItem(); }}>Remove</button>
      </div>
    </div>
  );
}

function NutritionalTable({ nutrition, nutritionPrices }) {
  return (
    <table className="nutritional-table">
      <thead>
        <tr>
          <th></th>
          <th>Calories</th>
          <th>Protein</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>{nutrition.portion_weight.toPrecision(PRECISION)}g</th>
          <td>{nutrition.calories.toPrecision(PRECISION)}kcal</td>
          <td>{nutrition.protein.toPrecision(PRECISION)}g</td>
        </tr>
        <tr>
          <th>Prices</th>
          <td>{nutritionPrices.calories.toPrecision(PRECISION)}kcal</td>
          <td>{nutritionPrices.protein.toPrecision(PRECISION)}g</td>
        </tr>
      </tbody>
    </table>
  )
}

export default App;
