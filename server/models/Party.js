const { Schema, model } = require('mongoose');

module.exports = model(
  'Party',
  new Schema(
    {
      type: { type: String, enum: ['customer', 'supplier'], required: true },
      name: { type: String, required: true, trim: true },
      phone: String,
      email: String,
      address: String,
      gstin: String,
    },
    { timestamps: true }
  )
);