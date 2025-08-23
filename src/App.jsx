import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [shoes, setShoes] = useState([]);
  const [sales, setSales] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);

  const [newShoe, setNewShoe] = useState({
    brand: "",
    type: "",
    partyName: "",
    buyingPrice: "",
    sellingPrice: "",
    size: "",
    quantity: "",
    description: "",
  });

  const [sellModal, setSellModal] = useState(null);
  const [sellDetails, setSellDetails] = useState({
    quantity: 1,
    sellingPrice: "",
    customer: "",
  });

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const shoesRes = await axios.get("http://localhost:5000/api/shoes");
    setShoes(shoesRes.data);

    const salesRes = await axios.get("http://localhost:5000/api/sales");
    setSales(salesRes.data);

    const profitRes = await axios.get("http://localhost:5000/api/profit");
    setTotalProfit(profitRes.data.totalProfit);
  };

  const addShoe = async () => {
    await axios.post("http://localhost:5000/api/shoes", newShoe);
    setNewShoe({
      brand: "",
      type: "",
      partyName: "",
      buyingPrice: "",
      sellingPrice: "",
      size: "",
      quantity: "",
      description: "",
    });
    fetchData();
  };

  const sellShoe = async (id) => {
    await axios.post(`http://localhost:5000/api/sell/${id}`, sellDetails);
    setSellModal(null);
    fetchData();
  };

  return (
    <div className="p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">Shoe Inventory</h1>

      {/* Add Shoe */}
      <div className="p-4 border rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Add New Shoe</h2>
        <input
          className="border p-1 m-1"
          placeholder="Brand"
          value={newShoe.brand}
          onChange={(e) => setNewShoe({ ...newShoe, brand: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          placeholder="Type"
          value={newShoe.type}
          onChange={(e) => setNewShoe({ ...newShoe, type: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          placeholder="Party Name"
          value={newShoe.partyName}
          onChange={(e) => setNewShoe({ ...newShoe, partyName: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          type="number"
          placeholder="Buying Price"
          value={newShoe.buyingPrice}
          onChange={(e) => setNewShoe({ ...newShoe, buyingPrice: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          type="number"
          placeholder="Selling Price"
          value={newShoe.sellingPrice}
          onChange={(e) => setNewShoe({ ...newShoe, sellingPrice: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          placeholder="Size"
          value={newShoe.size}
          onChange={(e) => setNewShoe({ ...newShoe, size: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          type="number"
          placeholder="Quantity"
          value={newShoe.quantity}
          onChange={(e) => setNewShoe({ ...newShoe, quantity: e.target.value })}
        />
        <input
          className="border p-1 m-1"
          placeholder="Description"
          value={newShoe.description}
          onChange={(e) => setNewShoe({ ...newShoe, description: e.target.value })}
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded ml-2"
          onClick={addShoe}
        >
          Add
        </button>
      </div>

      {/* Shoe List */}
      <h2 className="text-lg font-semibold mb-2">Inventory</h2>
      <table className="border w-full mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th>Brand</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Buying Price</th>
            <th>Selling Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {shoes.map((s) => (
            <tr key={s._id} className={s.quantity < 5 ? "bg-red-100" : ""}>
              <td>{s.brand}</td>
              <td>{s.type}</td>
              <td>{s.quantity}</td>
              <td>{s.buyingPrice}</td>
              <td>{s.sellingPrice}</td>
              <td>
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded"
                  onClick={() => setSellModal(s)}
                >
                  Sell
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sales History */}
      <h2 className="text-lg font-semibold mb-2">Sales History</h2>
      <p className="mb-2">Total Profit: ₹{totalProfit}</p>
      <table className="border w-full">
        <thead>
          <tr className="bg-gray-200">
            <th>Date</th>
            <th>Brand</th>
            <th>Qty</th>
            <th>Selling Price</th>
            <th>Profit</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s._id}>
              <td>{new Date(s.date).toLocaleString()}</td>
              <td>{s.brand}</td>
              <td>{s.quantity}</td>
              <td>{s.sellingPrice}</td>
              <td>{s.profit}</td>
              <td>{s.customer}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sell Modal */}
      {sellModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-lg font-bold mb-2">Sell {sellModal.brand}</h2>
            <input
              type="number"
              className="border p-1 w-full mb-2"
              placeholder="Quantity"
              value={sellDetails.quantity}
              onChange={(e) =>
                setSellDetails({ ...sellDetails, quantity: e.target.value })
              }
            />
            <input
              type="number"
              className="border p-1 w-full mb-2"
              placeholder="Selling Price"
              value={sellDetails.sellingPrice}
              onChange={(e) =>
                setSellDetails({ ...sellDetails, sellingPrice: e.target.value })
              }
            />
            <input
              className="border p-1 w-full mb-2"
              placeholder="Customer"
              value={sellDetails.customer}
              onChange={(e) =>
                setSellDetails({ ...sellDetails, customer: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-3 py-1 rounded"
                onClick={() => setSellModal(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded"
                onClick={() => sellShoe(sellModal._id)}
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
