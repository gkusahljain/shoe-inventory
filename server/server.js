// server/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import Shoe from "./models/Shoe.js";
import Sale from "./models/Sale.js";

dotenv.config();

const app = express();

// CORS — allow localhost and your frontend URL
const allowed = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN // e.g. https://shoe-inventory-frontend.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

// ------------------ ROUTES ------------------ //

// GET all shoes (optional search ?q=)
app.get("/api/shoes", async (req, res) => {
  const q = (req.query.q || "").trim();
  const filter = q
    ? {
        $or: [
          { brand: new RegExp(q, "i") },
          { type: new RegExp(q, "i") },
          { party: new RegExp(q, "i") },
          { description: new RegExp(q, "i") }
        ]
      }
    : {};
  const shoes = await Shoe.find(filter).sort({ createdAt: -1 });
  res.json(shoes);
});

// Create new shoe
app.post("/api/shoes", async (req, res) => {
  try {
    const payload = {
      brand: req.body.brand,
      type: req.body.type,
      party: req.body.party,
      buyingPrice: Number(req.body.buyingPrice),
      description: req.body.description || "",
      quantity: Number(req.body.quantity),
      size: Number(req.body.size),
      defaultSellingPrice: Number(req.body.sellingPrice)
    };
    const created = await Shoe.create(payload);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Update a shoe (edit)
app.put("/api/shoes/:id", async (req, res) => {
  const updated = await Shoe.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  res.json(updated);
});

// Delete a shoe
app.delete("/api/shoes/:id", async (req, res) => {
  await Shoe.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Sell shoe (dynamic price per sale)
app.patch("/api/shoes/:id/sell", async (req, res) => {
  try {
    const { qty = 1, sellingPrice } = req.body;
    const nQty = Math.max(1, Number(qty));
    const nSell = Number(sellingPrice);

    if (Number.isNaN(nSell) || nSell < 0)
      return res.status(400).json({ message: "Invalid selling price" });

    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) return res.status(404).json({ message: "Not found" });

    if ((shoe.quantity || 0) < nQty)
      return res.status(400).json({ message: "Not enough stock" });

    // update stock and sold count
    shoe.quantity = (shoe.quantity || 0) - nQty;
    shoe.sold = (shoe.sold || 0) + nQty;

    // record sale + profit
    const profit = (nSell - shoe.buyingPrice) * nQty;
    await Sale.create({
      shoe: shoe._id,
      qty: nQty,
      sellingPrice: nSell,
      buyingPriceAtSale: shoe.buyingPrice,
      profit
    });

    await shoe.save();
    res.json(shoe);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Restock shoe (add stock, optional update buying price)
app.patch("/api/shoes/:id/restock", async (req, res) => {
  try {
    const { qty = 1, buyingPrice } = req.body;
    const nQty = Math.max(1, Number(qty));

    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) return res.status(404).json({ message: "Not found" });

    shoe.quantity = (shoe.quantity || 0) + nQty;

    if (buyingPrice !== undefined && buyingPrice !== "") {
      const nBuy = Number(buyingPrice);
      if (!Number.isNaN(nBuy) && nBuy >= 0) shoe.buyingPrice = nBuy;
    }

    await shoe.save();
    res.json(shoe);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Total profit
app.get("/api/profit", async (req, res) => {
  const { range } = req.query; // today | week | month | all
  let from = null;
  const now = new Date();

  if (range === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "week") {
    const day = now.getDay();
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (range === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filter = from ? { createdAt: { $gte: from } } : {};
  const sales = await Sale.find(filter);
  const totalProfit = sales.reduce((s, x) => s + (x.profit || 0), 0);
  res.json({ totalProfit });
});

// Sales list
app.get("/api/sales", async (req, res) => {
  const { range } = req.query;
  let from = null;
  const now = new Date();

  if (range === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "week") {
    const day = now.getDay();
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (range === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filter = from ? { createdAt: { $gte: from } } : {};
  const sales = await Sale.find(filter).populate("shoe").sort({ createdAt: -1 });
  res.json(sales);
});

// Export sales to CSV
app.get("/api/export/sales.csv", async (req, res) => {
  const sales = await Sale.find().populate("shoe").sort({ createdAt: -1 });
  const header = "Date,Brand,Type,Party,Size,Qty,BuyingPrice,SellingPrice,Profit\n";
  const lines = sales.map((s) => {
    const d = new Date(s.createdAt).toISOString();
    const brand = s.shoe?.brand || "";
    const type = s.shoe?.type || "";
    const party = s.shoe?.party || "";
    const size = s.shoe?.size || "";
    return [
      d,
      brand,
      type,
      party,
      size,
      s.qty,
      s.buyingPriceAtSale,
      s.sellingPrice,
      s.profit
    ].join(",");
  });
  res.setHeader("Content-Type", "text/csv");
  res.send(header + lines.join("\n"));
});

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`✅ API running at http://localhost:${port}`)
);
