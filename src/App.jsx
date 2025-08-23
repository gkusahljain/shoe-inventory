import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    brand: "",
    type: "",
    party: "",
    buyingPrice: "",
    description: "",
    quantity: "",
    size: "6",
    sellingPrice: "" // default selling price suggestion
  });
  const [profit, setProfit] = useState(0);
  const LOW_STOCK = 5;

  const loadAll = async () => {
    const shoes = await fetch(`${API}/shoes`).then((r) => r.json());
    setInventory(shoes);
    const prof = await fetch(`${API}/profit?range=all`).then((r) => r.json());
    setProfit(prof.totalProfit || 0);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const addShoe = async (e) => {
    e.preventDefault();
    const payload = {
      brand: form.brand.trim(),
      type: form.type.trim(),
      party: form.party.trim(),
      buyingPrice: Number(form.buyingPrice),
      description: form.description.trim(),
      quantity: Number(form.quantity),
      size: Number(form.size),
      sellingPrice: Number(form.sellingPrice)
    };
    const res = await fetch(`${API}/shoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      alert("Failed to add shoe");
      return;
    }
    setForm({
      brand: "",
      type: "",
      party: "",
      buyingPrice: "",
      description: "",
      quantity: "",
      size: "6",
      sellingPrice: ""
    });
    loadAll();
  };

  const sell = async (id, defaultPrice) => {
    const qtyStr = window.prompt("Enter quantity to sell:", "1");
    if (!qtyStr) return;
    const priceStr = window.prompt(
      "Enter per-unit selling price (can vary per customer):",
      String(defaultPrice ?? "")
    );
    if (!priceStr) return;

    const qty = Number(qtyStr);
    const sellingPrice = Number(priceStr);
    if (Number.isNaN(qty) || qty <= 0 || Number.isNaN(sellingPrice) || sellingPrice < 0) {
      alert("Invalid quantity or price");
      return;
    }

    const res = await fetch(`${API}/shoes/${id}/sell`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty, sellingPrice })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Sell failed");
      return;
    }
    await loadAll();
  };

  const restock = async (id) => {
    const qtyStr = window.prompt("Enter quantity to add:", "1");
    if (!qtyStr) return;
    const newBuyStr = window.prompt(
      "Optional: new buying price (leave blank to keep current):",
      ""
    );
    const body = { qty: Number(qtyStr) };
    if (newBuyStr !== null && newBuyStr !== "") body.buyingPrice = Number(newBuyStr);

    const res = await fetch(`${API}/shoes/${id}/restock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Restock failed");
      return;
    }
    await loadAll();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this shoe?")) return;
    await fetch(`${API}/shoes/${id}`, { method: "DELETE" });
    await loadAll();
  };

  const totalInvestment = useMemo(
    () =>
      inventory.reduce(
        (sum, item) => sum + Number(item.buyingPrice || 0) * Number(item.quantity || 0),
        0
      ),
    [inventory]
  );

  const filtered = inventory.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.brand || "").toLowerCase().includes(q) ||
      (item.type || "").toLowerCase().includes(q) ||
      (item.party || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 12 }}>
      <h1>Shoe Factory 👟</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          margin: "12px 0"
        }}
      >
        <StatCard label="Total Investment (current stock)" value={`₹${totalInvestment}`} />
        <StatCard label="Total Profit (all time)" value={`₹${profit}`} />
        <StatCard
          label="Low Stock Items"
          value={inventory.filter((i) => (i.quantity || 0) < 5).length}
        />
        <a
          href={`${API}/export/sales.csv`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ddd",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          ⬇️ Export Sales CSV
        </a>
      </div>

      {/* Add / Restock Form */}
      <form
        onSubmit={addShoe}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          border: "1px solid #eee",
          padding: 12,
          borderRadius: 8
        }}
      >
        <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
        <input name="type" placeholder="Type" value={form.type} onChange={handleChange} />
        <input name="party" placeholder="Party Name" value={form.party} onChange={handleChange} />
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
          <option value="6">6</option><option value="7">7</option>
          <option value="8">8</option><option value="9">9</option>
          <option value="10">10</option>
        </select>
        <input
          name="sellingPrice"
          type="number"
          placeholder="Default Selling Price"
          value={form.sellingPrice}
          onChange={handleChange}
        />
        <button type="submit" style={{ gridColumn: "span 4" }}>Add Product</button>
      </form>

      {/* Search */}
      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Brand, Type, or Party"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 8px", width: 280 }}
        />
      </div>

      {/* Inventory Table */}
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th>#</th>
            <th>Brand</th>
            <th>Type</th>
            <th>Party</th>
            <th>Buying Price</th>
            <th>Qty</th>
            <th>Size</th>
            <th>Default Selling</th>
            <th>Sold</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item, i) => {
            const soldOut = Number(item.quantity) <= 0;
            const low = Number(item.quantity) > 0 && Number(item.quantity) < LOW_STOCK;
            return (
              <tr key={item._id} style={{ borderTop: "1px solid #eee" }}>
                <td>{i + 1}</td>
                <td>{item.brand}</td>
                <td>{item.type}</td>
                <td>{item.party}</td>
                <td>₹{item.buyingPrice}</td>
                <td style={{ fontWeight: low ? 700 : 400, color: low ? "#b45309" : "inherit" }}>
                  {soldOut ? <span style={{ color: "red", fontWeight: 700 }}>Sold Out</span> : item.quantity}
                </td>
                <td>{item.size}</td>
                <td>₹{item.defaultSellingPrice}</td>
                <td>{item.sold || 0}</td>
                <td>
                  {!soldOut ? (
                    <button onClick={() => sell(item._id, item.defaultSellingPrice)}>Sell</button>
                  ) : (
                    <button disabled style={{ opacity: 0.6 }}>Sold Out</button>
                  )}{" "}
                  <button onClick={() => restock(item._id)}>Restock</button>{" "}
                  <button style={{ background: "red", color: "#fff" }} onClick={() => remove(item._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="10" style={{ textAlign: "center", color: "gray", padding: 24 }}>
                No matching shoes found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}
    >
      <div style={{ color: "#555", fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
    </div>
  );
}
