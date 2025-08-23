import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/shoe_inventory", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ✅ Shoe Schema
const ShoeSchema = new mongoose.Schema({
  brand: String,
  type: String,
  partyName: String,
  buyingPrice: Number,
  sellingPrice: Number, // default reference selling price
  size: String,
  quantity: Number,
  description: String,
});
const Shoe = mongoose.model("Shoe", ShoeSchema);

// ✅ Sales Schema
const SaleSchema = new mongoose.Schema({
  shoeId: { type: mongoose.Schema.Types.ObjectId, ref: "Shoe" },
  brand: String,
  type: String,
  customer: String,
  quantity: Number,
  buyingPrice: Number,
  sellingPrice: Number, // actual selling price
  profit: Number,
  date: { type: Date, default: Date.now },
});
const Sale = mongoose.model("Sale", SaleSchema);

// ================= API ROUTES =================

// Add new shoe
app.post("/api/shoes", async (req, res) => {
  const shoe = new Shoe(req.body);
  await shoe.save();
  res.json(shoe);
});

// Get all shoes
app.get("/api/shoes", async (req, res) => {
  const shoes = await Shoe.find();
  res.json(shoes);
});

// Sell shoe
app.post("/api/sell/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity, sellingPrice, customer } = req.body;

  const shoe = await Shoe.findById(id);
  if (!shoe) return res.status(404).json({ error: "Shoe not found" });

  if (shoe.quantity < quantity) {
    return res.status(400).json({ error: "Not enough stock" });
  }

  // reduce stock
  shoe.quantity -= quantity;
  await shoe.save();

  // calculate profit
  const profit = (sellingPrice - shoe.buyingPrice) * quantity;

  // save sale record
  const sale = new Sale({
    shoeId: shoe._id,
    brand: shoe.brand,
    type: shoe.type,
    customer,
    quantity,
    buyingPrice: shoe.buyingPrice,
    sellingPrice,
    profit,
  });
  await sale.save();

  res.json({ message: "Sale recorded", sale });
});

// Get sales history
app.get("/api/sales", async (req, res) => {
  const sales = await Sale.find().sort({ date: -1 });
  res.json(sales);
});

// Get total profit
app.get("/api/profit", async (req, res) => {
  const sales = await Sale.find();
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  res.json({ totalProfit });
});

app.listen(5000, () => console.log("Server running on port 5000"));
