import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config.js";
import Shoe from "./models/Shoe.js";

const app = express();

// ----- CORS -----
const allowed = [ "http://localhost:5173", process.env.CLIENT_ORIGIN ].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// ----- Body -----
app.use(express.json());

// ----- DB -----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

// ----- Routes -----

// List shoes (supports ?q= search)
app.get("/api/shoes", async (req, res) => {
  const q = req.query.q?.trim();
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

// Create shoe
app.post("/api/shoes", async (req, res) => {
  try {
    const shoe = await Shoe.create(req.body);
    res.status(201).json(shoe);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Update shoe
app.put("/api/shoes/:id", async (req, res) => {
  try {
    const updated = await Shoe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Sell (qty + variable price + optional customer)
app.patch("/api/shoes/:id/sell", async (req, res) => {
  try {
    const { qty = 1, price, customer = "" } = req.body;
    const q = Number(qty);
    const p = Number(price);
    if (!Number.isFinite(q) || q <= 0) return res.status(400).json({ message: "Invalid qty" });
    if (!Number.isFinite(p) || p < 0) return res.status(400).json({ message: "Invalid price" });

    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) return res.status(404).json({ message: "Not found" });
    if ((shoe.quantity || 0) < q) return res.status(400).json({ message: "Not enough stock" });

    shoe.quantity = shoe.quantity - q;
    shoe.salesHistory.push({ qty: q, price: p, customer });
    await shoe.save();

    res.json(shoe);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete shoe
app.delete("/api/shoes/:id", async (req, res) => {
  await Shoe.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Get sales history for a shoe
app.get("/api/shoes/:id/sales", async (req, res) => {
  const shoe = await Shoe.findById(req.params.id).select("brand type salesHistory size");
  if (!shoe) return res.status(404).json({ message: "Not found" });
  res.json(shoe.salesHistory);
});

// Get ALL sales (for CSV export / reports)
app.get("/api/sales", async (_req, res) => {
  const rows = await Shoe.aggregate([
    { $unwind: "$salesHistory" },
    {
      $project: {
        brand: 1,
        type: 1,
        size: 1,
        saleDate: "$salesHistory.createdAt",
        qty: "$salesHistory.qty",
        price: "$salesHistory.price",
        customer: "$salesHistory.customer"
      }
    },
    { $sort: { saleDate: -1 } }
  ]);
  res.json(rows);
});

// Health
app.get("/", (_req, res) => res.send("API OK ✔️"));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ API running at http://localhost:${port}`));
