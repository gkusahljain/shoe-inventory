const mongoose = require("mongoose");

const ShoeSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    type: { type: String, required: true },
    party: { type: String, required: true },
    buyingPrice: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    size: { type: Number, required: true },
    defaultSellingPrice: { type: Number, required: true, min: 0 }, // a suggested price; actual sale can vary
    sold: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shoe", ShoeSchema);
