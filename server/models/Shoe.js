import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
  {
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // per-sale selling price
    customer: { type: String, default: "" }
  },
  { timestamps: true }
);

const ShoeSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    type: { type: String, required: true },
    party: { type: String, required: true },
    buyingPrice: { type: Number, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    size: { type: Number, required: true },
    sellingPrice: { type: Number, required: true }, // default/target price
    salesHistory: { type: [SaleSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Shoe", ShoeSchema);
