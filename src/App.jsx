import { useEffect, useState } from "react";

// Base API, trim trailing slash, then build /shoes endpoints
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const SHOES_URL = `${API_BASE}/shoes`;

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

  // Load inventory on mount
  useEffect(() => {
    fetch(SHOES_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`GET /shoes failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setInventory(data))
      .catch((err) => {
        console.error(err);
        alert("Failed to load shoes from the server.");
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Create
  const handleSubmit = async (e) => {
    e.preventDefault();
    const required =
      form.brand &&
      form.type &&
      form.party &&
      form.buyingPrice &&
      form.description &&
      form.quantity &&
      form.size &&
      form.sellingPrice;
    if (!required) return;

    // Cast numeric fields
    const payload = {
      brand: form.brand.trim(),
      type: form.type.trim(),
      party: form.party.trim(),
      buyingPrice: Number(form.buyingPrice),
      description: form.description.trim(),
      quantity: Number(form.quantity),
      size: Number(form.size),
      sellingPrice: Number(form.sellingPrice),
    };

    try {
      const res = await fetch(SHOES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Create failed");
      setInventory((prev) => [data, ...prev]);
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
    } catch (err) {
      console.error(err);
      alert("Failed to add shoe (check CORS and server logs).");
    }
  };

  const handleSellChange = (id, value) => setSellInputs({ ...sellInputs, [id]: value });
  const rowId = (item) => item._id || item.id;

  // Sell via PATCH /sell
  const sellShoe = async (id) => {
    const qtyToSell = Math.max(1, parseInt(sellInputs[id] || 1));
    try {
      const res = await fetch(`${SHOES_URL}/${id}/sell`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: qtyToSell }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Sell failed");
      setInventory((prev) => prev.map((it) => (rowId(it) === id ? data : it)));
      setSellInputs((s) => ({ ...s, [id]: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to sell shoe.");
    }
  };

  // Delete
  const deleteShoe = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shoe?")) return;
    try {
      const res = await fetch(`${SHOES_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setInventory((prev) => prev.filter((it) => rowId(it) !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete shoe.");
    }
  };

  const totalInvestment = inventory.reduce(
    (sum, item) => sum + Number(item.buyingPrice || 0) * Number(item.quantity || 0),
    0
  );

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.brand || "").toLowerCase().includes(q) ||
      (item.type || "").toLowerCase().includes(q) ||
      (item.party || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      <h1>Shoe Factory</h1>

      <form onSubmit={handleSubmit}>
        <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
        <input name="type" placeholder="Type" value={form.type} onChange={handleChange} />
        <input name="party" placeholder="Party Name" value={form.party} onChange={handleChange} />
        <input name="buyingPrice" type="number" placeholder="Buying Price" value={form.buyingPrice} onChange={handleChange} />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
        <select name="size" value={form.size} onChange={handleChange}>
          <option value="6">6</option><option value="7">7</option><option value="8">8</option>
          <option value="9">9</option><option value="10">10</option>
        </select>
        <input name="sellingPrice" type="number" placeholder="Selling Price" value={form.sellingPrice} onChange={handleChange} />
        <button type="submit">Add Shoe</button>
      </form>

      <h2>Total Investment: ₹{totalInvestment}</h2>

      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Brand, Type, or Party"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "5px", width: "250px" }}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>SL.NO</th><th>Brand</th><th>Type</th><th>Party Name</th>
            <th>Buying Price</th><th>Description</th><th>Quantity</th>
            <th>Size</th><th>Selling Price</th><th>Sell</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item, idx) => {
            const id = rowId(item);
            return (
              <tr key={id}>
                <td>{idx + 1}</td>
                <td>{item.brand}</td>
                <td>{item.type}</td>
                <td>{item.party}</td>
                <td>₹{item.buyingPrice}</td>
                <td>{item.description}</td>
                <td>
                  {item.quantity > 0 ? item.quantity : <span style={{ color: "red", fontWeight: "bold" }}>Sold Out</span>}
                </td>
                <td>{item.size}</td>
                <td>₹{item.sellingPrice}</td>
                <td>
                  {item.quantity > 0 ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        value={sellInputs[id] || ""}
                        onChange={(e) => handleSellChange(id, e.target.value)}
                        placeholder="Qty"
                        style={{ width: "60px", marginRight: "5px" }}
                      />
                      <button onClick={() => sellShoe(id)}>Sell</button>
                    </>
                  ) : (
                    <button disabled style={{ opacity: 0.5 }}>Sold Out</button>
                  )}
                </td>
                <td>
                  <button onClick={() => deleteShoe(id)} style={{ backgroundColor: "red", color: "white" }}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          {filteredInventory.length === 0 && (
            <tr><td colSpan="11" style={{ textAlign: "center", color: "gray" }}>No matching shoes found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
