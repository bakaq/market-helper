import { useState, useEffect } from 'react';

// TODO: Configure it at build-time
function api_root() {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
}

const PRECISION = 3;

const fields = {
  name: "Name",
  weight: "Weight",
  price: "Price",
  portionWeight: "Portion weight",
  calories: "Calories",
  carbohidrates: "Carbs",
  protein: "Protein",
  totalFat: "Total Fat",
  saturatedFat: "Saturated Fat",
  fiber: "Fiber",
};

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
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("desc");

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

  const sortedItems = items.toSorted((a, b) => {
    if (sortDir === "asc") {
      [a, b] = [b, a];
    }
    switch (sortKey) {
      case "name":
        return a.item.name < b.item.name;
      case "price":
        return a.item.price < b.item.price;
      case "calories_price":
        return a.item.nutrition_prices.calories < b.item.nutrition_prices.calories;
      case "carbohidrates_price":
        return a.item.nutrition_prices.carbohidrates < b.item.nutrition_prices.carbohidrates;
      case "protein_price":
        return a.item.nutrition_prices.protein < b.item.nutrition_prices.protein;
      case "total_fat_price":
        return a.item.nutrition_prices.total_fat < b.item.nutrition_prices.total_fat;
      case "saturated_fat_price":
        return a.item.nutrition_prices.saturated_fat < b.item.nutrition_prices.saturated_fat;
      case "fiber_price":
        return a.item.nutrition_prices.fiber < b.item.nutrition_prices.fiber;
      default:
        return a.item.name < b.item.name;
    }
  });

  const itemList = sortedItems.map((item) =>
    <li key={item.id}>
      <ItemCard itemId={item.id} itemData={item.item} getItems={getItems} />
    </li>
  );

  return (
    <div className="item-list">
      <div className="item-list-header">
        <h2>Items</h2>
        <div className="item-sort">
          <select value={sortKey} onChange={(e) => { setSortKey(e.target.value); getItems(); }}>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="calories_price">Calorie Price</option>
            <option value="carbohidrate_price">Carbohidrate Price</option>
            <option value="protein_price">Protein Price</option>
            <option value="total_fat_price">Total Fat Price</option>
            <option value="saturated_fat_price">Saturated Fat Price</option>
            <option value="fiber_price">Fiber Price</option>
          </select>
          <select value={sortDir} onChange={(e) => { setSortDir(e.target.value); getItems(); }}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
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
  const [inputs, setInputs] = useState({});

  function changeHandler(event) {
    const name = event.target.name;
    const value = event.target.value;
    setInputs(old => ({ ...old, [name]: value }));
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
        carbohidrates: parseFloat(inputs.carbohidrates),
        protein: parseFloat(inputs.protein),
        total_fat: parseFloat(inputs.totalFat),
        saturated_fat: parseFloat(inputs.saturatedFat),
        fiber: parseFloat(inputs.fiber),
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

    // Reload the list and hide form.
    getItems();
    setShow(false);
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
  const [editing, setEditing] = useState(false);

  async function removeItem() {
    if (window.confirm(`Do you really want to delete ${itemData.name}?`)) {
      await fetch(`${api_root()}/item/remove`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: parseInt(itemId) }),
      });
      getItems();
    }
  }
  return (
    editing ?
      <ItemEdit itemId={itemId} itemData={itemData} getItems={getItems} setEditing={setEditing} />
      :
      (
        <div className="item-card">
            <h3>{itemData.name}</h3>
          <div className="item-card-header">
            <div className="item-price">R$ {itemData.price.toFixed(2)}</div>
            <div className="item-weight">{itemData.weight.toPrecision(PRECISION)}g</div>
          </div>
          <details>
            <summary>Nutritional Table</summary>
            <NutritionalTable nutrition={itemData.nutrition} nutritionPrices={itemData.nutrition_prices} />
          </details>
          <div className="item-card-footer">
            <button onClick={() => setEditing(true)}>Edit</button>
            <button onClick={() => { removeItem(); }}>Remove</button>
          </div>
        </div>
      )
  );
}

function ItemEdit({ itemId, itemData, getItems, setEditing }) {
  const defaultInputs = {
    name: itemData.name,
    price: itemData.price,
    weight: itemData.weight,
    portionWeight: itemData.nutrition.portion_weight,
    calories: itemData.nutrition.calories,
    carbohidrates: itemData.nutrition.calories,
    protein: itemData.nutrition.protein,
    totalFat: itemData.nutrition.total_fat,
    saturatedFat: itemData.nutrition.saturated_fat,
    fiber: itemData.nutrition.fiber,
  };
  const [inputs, setInputs] = useState(defaultInputs);

  function changeHandler(event) {
    const name = event.target.name;
    const value = event.target.value;
    setInputs(old => ({ ...old, [name]: value }));
  }

  const fieldsArray = Object.entries(fields).map(([name, label]) => (
    <div key={name} className="field">
      <label htmlFor={`edit-${name}`}>{label}:</label>
      <input type="text" id={`edit-${name}`} name={name} value={inputs[name]} onChange={changeHandler} />
    </div>
  ));

  async function submitHandler(event) {
    event.preventDefault();

    const updateRequest = {
      id: itemId,
      new_item: {
        name: inputs.name,
        price: parseFloat(inputs.price),
        weight: parseFloat(inputs.weight),
        nutrition: {
          portion_weight: parseFloat(inputs.portionWeight),
          calories: parseFloat(inputs.calories),
          carbohidrates: parseFloat(inputs.carbohidrates),
          protein: parseFloat(inputs.protein),
          total_fat: parseFloat(inputs.totalFat),
          saturated_fat: parseFloat(inputs.saturatedFat),
          fiber: parseFloat(inputs.fiber),
        },
      }
    };
    await fetch(`${api_root()}/item/update`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateRequest),
    });

    // Reload the list and hide form.
    setEditing(false);
    getItems();
  }

  return (
    <form className="edit-form" onSubmit={submitHandler}>
      <div className="edit-form-fields">
        {fieldsArray}
      </div>
      <div className="edit-form-footer">
        <input type="submit" id="submit-edit" value="Update item" />
        <button onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </form>
  );
}


function NutritionalTable({ nutrition, nutritionPrices }) {
  return (
    <div className="nutritional-tables">
      <table className="nutritional-table">
        <thead>
          <tr>
            <th></th>
            <th>Calories</th>
            <th>Carbs</th>
            <th>Protein</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>{nutrition.portion_weight.toPrecision(PRECISION)}g</th>
            <td>{nutrition.calories.toPrecision(PRECISION)}kcal</td>
            <td>{nutrition.carbohidrates.toPrecision(PRECISION)}g</td>
            <td>{nutrition.protein.toPrecision(PRECISION)}g</td>
          </tr>
          <tr>
            <th>Prices</th>
            <td>{nutritionPrices.calories.toPrecision(PRECISION)} kcal/R$</td>
            <td>{nutritionPrices.carbohidrates.toPrecision(PRECISION)} g/R$</td>
            <td>{nutritionPrices.protein.toPrecision(PRECISION)} g/R$</td>
          </tr>
        </tbody>
      </table>
      <table className="nutritional-table">
        <thead>
          <tr>
            <th></th>
            <th>Total Fat</th>
            <th>Saturated Fat</th>
            <th>Fiber</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>{nutrition.portion_weight.toPrecision(PRECISION)}g</th>
            <td>{nutrition.total_fat.toPrecision(PRECISION)}g</td>
            <td>{nutrition.saturated_fat.toPrecision(PRECISION)}g</td>
            <td>{nutrition.fiber.toPrecision(PRECISION)}g</td>
          </tr>
          <tr>
            <th>Prices</th>
            <td>{nutritionPrices.total_fat.toPrecision(PRECISION)} g/R$</td>
            <td>{nutritionPrices.saturated_fat.toPrecision(PRECISION)} g/R$</td>
            <td>{nutritionPrices.fiber.toPrecision(PRECISION)} g/R$</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default App;
