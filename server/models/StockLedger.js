const { Schema, model } = require('mongoose');

module.exports = model(
  'StockLedger',
  new Schema(
    {
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
      qty: { type: Number, required: true }, // positive = in, negative = out
      reason: {
        type: String,
        enum: ['purchase', 'sale', 'sale_cancel', 'purchase_cancel', 'adjustment'],
        required: true,
      },
      ref: { type: Schema.Types.ObjectId, ref: 'Order' },
      note: String,
      balance: Number, // stock after this movement
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
  )
);