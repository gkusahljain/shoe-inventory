import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL; // e.g. https://shoe-inventory-1.onrender.com/api

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
    sellingPrice: ""
  });
  const [sellModal, setSellModal] = useState({ open: false, item: null });
  const [sellQty, setSellQty] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellCustomer, setSellCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [historyModal, setHistoryModal] = useState({ open: false, item: null, history: [] });

  // load inventory
  useEffect(() => {
    fetch(`${API}/shoes`)
      .then((r) => r.json())
      .then(setInventory)
      .catch((e) => console.error("Load error:", e));
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid =
      form.brand && form.type && form.party && form.buyingPrice && form.description &&
      form.quantity && form.size && form.sellingPrice;

    if (!valid) return;

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
    const created = await res.json();
    setInventory((prev) => [created, ...prev]);
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
  };

  // open sell dialog
  const openSell = (item) => {
    setSellQty("");
    setSellPrice(item.sellingPrice || "");
    setSellCustomer("");
    setSellModal({ open: true, item });
  };

  const doSell = async () => {
    const qty = Math.max(1, parseInt(sellQty || "1"));
    const price = Number(sellPrice);
    if (!Number.isFinite(price)) return alert("Enter a valid price");
    const res = await fetch(`${API}/shoes/${sellModal.item._id}/sell`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty, price, customer: sellCustomer.trim() })
    });
    if (!res.ok) {
      const m = await res.json().catch(() => ({}));
      return alert(m.message || "Sell failed");
    }
    const updated = await res.json();
    setInventory((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    setSellModal({ open: false, item: null });
  };

  const deleteShoe = async (id) => {
    if (!confirm("Delete this shoe?")) return;
    await fetch(`${API}/shoes/${id}`, { method: "DELETE" });
    setInventory((prev) => prev.filter((x) => x._id !== id));
  };

  const viewHistory = async (item) => {
    const res = await fetch(`${API}/shoes/${item._id}/sales`);
    const history = await res.json();
    setHistoryModal({ open: true, item, history });
  };

  const exportCSV = async () => {
    const res = await fetch(`${API}/sales`);
    const rows = await res.json();
    const header = ["Date", "Brand", "Type", "Size", "Qty", "Price", "Customer"];
    const body = rows.map((r) => [
      new Date(r.saleDate).toLocaleString(),
      r.brand,
      r.type,
      r.size,
      r.qty,
      r.price,
      r.customer || ""
    ]);
    const csv = [header, ...body].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalInvestment = useMemo(
    () => inventory.reduce((sum, i) => sum + Number(i.buyingPrice || 0) * Number(i.quantity || 0), 0),
    [inventory]
  );

  const filteredInventory = inventory.filter((item) => {
    const s = search.toLowerCase();
    return (
      (item.brand || "").toLowerCase().includes(s) ||
      (item.type || "").toLowerCase().includes(s) ||
      (item.party || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="container" style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Shoe Factory</h1>

      {/* Add form */}
      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
        <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
        <input name="type" placeholder="Type" value={form.type} onChange={handleChange} />
        <input name="party" placeholder="Party Name" value={form.party} onChange={handleChange} />
        <input name="buyingPrice" type="number" placeholder="Buying Price" value={form.buyingPrice} onChange={handleChange} />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
        <select name="size" value={form.size} onChange={handleChange}>
          {[6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <input name="sellingPrice" type="number" placeholder="Default Selling Price" value={form.sellingPrice} onChange={handleChange} />
        <div style={{ gridColumn: "span 6", display: "flex", gap: 10 }}>
          <button type="submit">Add Shoe</button>
          <button type="button" onClick={exportCSV}>Export Sales CSV</button>
        </div>
      </form>

      <h2 style={{ marginTop: 16 }}>Total Investment: ₹{totalInvestment}</h2>

      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Search by Brand, Type, or Party"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "5px", width: "250px" }}
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["SL.NO","Brand","Type","Party Name","Buying Price","Description","Quantity","Size","Default Price","Sell","History","Action"].map(h =>
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item, i) => (
            <tr key={item._id}>
              <td style={{ padding: 8 }}>{i + 1}</td>
              <td style={{ padding: 8 }}>{item.brand}</td>
              <td style={{ padding: 8 }}>{item.type}</td>
              <td style={{ padding: 8 }}>{item.party}</td>
              <td style={{ padding: 8 }}>₹{item.buyingPrice}</td>
              <td style={{ padding: 8 }}>{item.description}</td>
              <td style={{ padding: 8 }}>
                {item.quantity > 0 ? item.quantity : <span style={{ color: "red", fontWeight: 700 }}>Sold Out</span>}
              </td>
              <td style={{ padding: 8 }}>{item.size}</td>
              <td style={{ padding: 8 }}>₹{item.sellingPrice}</td>
              <td style={{ padding: 8 }}>
                {item.quantity > 0 ? (
                  <button onClick={() => openSell(item)}>Sell</button>
                ) : (
                  <button disabled style={{ opacity: 0.5 }}>Sold Out</button>
                )}
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => viewHistory(item)}>View</button>
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => deleteShoe(item._id)} style={{ background: "red", color: "white" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredInventory.length === 0 && (
            <tr>
              <td colSpan="12" style={{ textAlign: "center", color: "gray", padding: 20 }}>
                No matching shoes found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Sell Modal */}
      {sellModal.open && (
        <div style={backdrop}>
          <div style={modal}>
            <h3>Sell: {sellModal.item.brand} / {sellModal.item.type}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <input type="number" min="1" placeholder="Quantity" value={sellQty} onChange={(e) => setSellQty(e.target.value)} />
              <input type="number" min="0" placeholder="Selling Price (this sale)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
              <input placeholder="Customer (optional)" value={sellCustomer} onChange={(e) => setSellCustomer(e.target.value)} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={doSell}>Confirm</button>
                <button onClick={() => setSellModal({ open: false, item: null })}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.open && (
        <div style={backdrop}>
          <div style={modal}>
            <h3>Sales History: {historyModal.item.brand} / {historyModal.item.type}</h3>
            {historyModal.history.length === 0 ? (
              <p style={{ color: "gray" }}>No sales yet.</p>
            ) : (
              <table style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Date</th>
                    <th style={{ textAlign: "left" }}>Qty</th>
                    <th style={{ textAlign: "left" }}>Price</th>
                    <th style={{ textAlign: "left" }}>Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModal.history
                    .slice()
                    .reverse()
                    .map((h, idx) => (
                      <tr key={idx}>
                        <td>{new Date(h.createdAt).toLocaleString()}</td>
                        <td>{h.qty}</td>
                        <td>₹{h.price}</td>
                        <td>{h.customer || "-"}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setHistoryModal({ open: false, item: null, history: [] })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 50
};

const modal = {
  background: "white",
  borderRadius: 12,
  padding: 16,
  width: "min(700px, 100%)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
};

export default App;
