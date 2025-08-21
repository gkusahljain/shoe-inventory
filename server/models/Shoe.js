const mongoose = require("mongoose");

const ShoeSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    type: { type: String, required: true },
    party: { type: String, required: true },
    buyingPrice: { type: Number, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    size: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shoe", ShoeSchema);
