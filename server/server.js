const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Shoe = require("./models/Shoe");
const app = express();

// tighter CORS in production: set CLIENT_ORIGIN in .env to your frontend URL
const allowed = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN, // e.g., https://your-frontend.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
}));


// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

// Routes
app.get("/api/shoes", async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q
    ? {
        $or: [
          { brand: new RegExp(q, "i") },
          { type: new RegExp(q, "i") },
          { party: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
        ],
      }
    : {};
  const shoes = await Shoe.find(filter).sort({ createdAt: -1 });
  res.json(shoes);
});

app.post("/api/shoes", async (req, res) => {
  try {
    const shoe = await Shoe.create(req.body);
    res.status(201).json(shoe);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.put("/api/shoes/:id", async (req, res) => {
  const updated = await Shoe.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

app.patch("/api/shoes/:id/sell", async (req, res) => {
  const { qty = 1 } = req.body;
  const shoe = await Shoe.findById(req.params.id);
  if (!shoe) return res.status(404).json({ message: "Not found" });
  shoe.quantity = Math.max(0, (shoe.quantity || 0) - Number(qty));
  await shoe.save();
  res.json(shoe);
});

app.delete("/api/shoes/:id", async (req, res) => {
  await Shoe.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`✅ API running at http://localhost:${port}`)
);
