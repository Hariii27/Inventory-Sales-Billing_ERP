const { Schema, model } = require('mongoose');

const itemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    type: { type: String, enum: ['sale', 'purchase'], required: true },
    number: { type: String, unique: true, sparse: true }, // assigned on confirmation
    party: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: Number,
    tax: Number,
    total: Number,
    status: { type: String, enum: ['draft', 'confirmed', 'cancelled'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function () {
  let subtotal = 0;
  let tax = 0;
  for (const i of this.items) {
    const line = i.qty * i.price;
    subtotal += line;
    tax += (line * i.gstRate) / 100;
  }
  this.subtotal = +subtotal.toFixed(2);
  this.tax = +tax.toFixed(2);
  this.total = +(subtotal + tax).toFixed(2);
});

module.exports = model('Order', orderSchema);