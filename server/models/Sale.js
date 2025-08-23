const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema(
  {
    shoe: { type: mongoose.Schema.Types.ObjectId, ref: "Shoe", required: true },
    qty: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true, min: 0 }, // per-unit sell price for this sale
    buyingPriceAtSale: { type: Number, required: true, min: 0 }, // captured from shoe.buyingPrice at sale time
    profit: { type: Number, required: true, min: 0 } // (sell - buy) * qty
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);
