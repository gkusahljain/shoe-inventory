import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api/shoes";

function App() {
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({
    brand: "",
    type: "",
    party: "",
    buyingPrice: "",
    description: "",
    quantity: "",
    size: "6",
    sellingPrice: "",
  });

  const [sellInputs, setSellInputs] = useState({});
  const [search, setSearch] = useState("");

  // 🔹 Load inventory from MongoDB on mount
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setInventory(data))
      .catch((err) => console.error("Error fetching shoes:", err));
  }, []);

  // 🔹 Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Add shoe (POST -> MongoDB)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      form.brand &&
      form.type &&
      form.party &&
      form.buyingPrice &&
      form.description &&
      form.quantity &&
      form.size &&
      form.sellingPrice
    ) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newShoe = await res.json();
      setInventory([...inventory, newShoe]); // update UI
      setForm({
        brand: "",
        type: "",
        party: "",
        buyingPrice: "",
        description: "",
        quantity: "",
        size: "6",
        sellingPrice: "",
      });
    }
  };

  // 🔹 Sell shoe (PUT -> MongoDB)
  const handleSellChange = (id, value) => {
    setSellInputs({ ...sellInputs, [id]: value });
  };

  const sellShoe = async (id) => {
    const qtyToSell = parseInt(sellInputs[id] || 1);
    const item = inventory.find((i) => i._id === id);

    if (!item) return;

    const updatedQty = Math.max(0, parseInt(item.quantity) - qtyToSell);

    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, quantity: updatedQty }),
    });

    const updated = await res.json();
    setInventory(inventory.map((i) => (i._id === updated._id ? updated : i)));
    setSellInputs({ ...sellInputs, [id]: "" });
  };

  // 🔹 Delete shoe (DELETE -> MongoDB)
  const deleteShoe = async (id) => {
    if (window.confirm("Are you sure you want to delete this shoe?")) {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setInventory(inventory.filter((i) => i._id !== id));
    }
  };

  // 🔹 Calculate total investment
  const totalInvestment = inventory.reduce(
    (sum, item) =>
      sum + parseInt(item.buyingPrice || 0) * parseInt(item.quantity || 0),
    0
  );

  // 🔹 Filter for search
  const filteredInventory = inventory.filter(
    (item) =>
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.party.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h1>Shoe Factory</h1>

      {/* Add Form */}
      <form onSubmit={handleSubmit}>
        <input
          name="brand"
          placeholder="Brand"
          value={form.brand}
          onChange={handleChange}
        />
        <input
          name="type"
          placeholder="Type"
          value={form.type}
          onChange={handleChange}
        />
        <input
          name="party"
          placeholder="Party Name"
          value={form.party}
          onChange={handleChange}
        />
        <input
          name="buyingPrice"
          type="number"
          placeholder="Buying Price"
          value={form.buyingPrice}
          onChange={handleChange}
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
        />
        <select name="size" value={form.size} onChange={handleChange}>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
        <input
          name="sellingPrice"
          type="number"
          placeholder="Selling Price"
          value={form.sellingPrice}
          onChange={handleChange}
        />
        <button type="submit">Add Shoe</button>
      </form>

      <h2>Total Investment: ₹{totalInvestment}</h2>

      {/* Search Bar */}
      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Brand, Type, or Party"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "5px", width: "250px" }}
        />
      </div>

      {/* Inventory Table */}
      <table>
        <thead>
          <tr>
            <th>SL.NO</th>
            <th>Brand</th>
            <th>Type</th>
            <th>Party Name</th>
            <th>Buying Price</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Size</th>
            <th>Selling Price</th>
            <th>Sell</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item, index) => (
            <tr key={item._id}>
              <td>{index + 1}</td>
              <td>{item.brand}</td>
              <td>{item.type}</td>
              <td>{item.party}</td>
              <td>₹{item.buyingPrice}</td>
              <td>{item.description}</td>
              <td>
                {item.quantity > 0 ? (
                  item.quantity
                ) : (
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    Sold Out
                  </span>
                )}
              </td>
              <td>{item.size}</td>
              <td>₹{item.sellingPrice}</td>
              <td>
                {item.quantity > 0 ? (
                  <>
                    <input
                      type="number"
                      min="1"
                      value={sellInputs[item._id] || ""}
                      onChange={(e) =>
                        handleSellChange(item._id, e.target.value)
                      }
                      placeholder="Qty"
                      style={{ width: "60px", marginRight: "5px" }}
                    />
                    <button onClick={() => sellShoe(item._id)}>Sell</button>
                  </>
                ) : (
                  <button disabled style={{ opacity: 0.5 }}>
                    Sold Out
                  </button>
                )}
              </td>
              <td>
                <button
                  onClick={() => deleteShoe(item._id)}
                  style={{ backgroundColor: "red", color: "white" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredInventory.length === 0 && (
            <tr>
              <td colSpan="11" style={{ textAlign: "center", color: "gray" }}>
                No matching shoes found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
