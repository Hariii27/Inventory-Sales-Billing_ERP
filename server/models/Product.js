const { Schema, model } = require('mongoose');

module.exports = model(
  'Product',
  new Schema(
    {
      sku: { type: String, required: true, unique: true, trim: true },
      name: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      gstRate: { type: Number, default: 18, min: 0, max: 100 },
      stock: { type: Number, default: 0, min: 0 }, // cached balance; changed only through the ledger
      reorderLevel: { type: Number, default: 10, min: 0 },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);