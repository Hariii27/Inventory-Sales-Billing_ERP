require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Party = require('./models/Party');
const Order = require('./models/Order');
const StockLedger = require('./models/StockLedger');
const Counter = require('./models/Counter');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Product, Party, Order, StockLedger, Counter].map((m) => m.deleteMany()));

  const admin = (await User.create([
    { name: 'Admin', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
    { name: 'Sales User', email: 'sales@demo.com', password: 'sales123', role: 'sales' },
    { name: 'Store User', email: 'store@demo.com', password: 'store123', role: 'store' },
  ]))[0];

  const products = await Product.create([
    { sku: 'P001', name: 'Wireless Keyboard', price: 800, gstRate: 18, stock: 100, reorderLevel: 20 },
    { sku: 'P002', name: 'Wireless Mouse', price: 450, gstRate: 18, stock: 150, reorderLevel: 30 },
    { sku: 'P003', name: 'USB-C Cable', price: 150, gstRate: 12, stock: 8, reorderLevel: 25 },
    { sku: 'P004', name: 'Laptop Stand', price: 1200, gstRate: 18, stock: 40, reorderLevel: 10 },
    { sku: 'P005', name: 'Webcam HD', price: 2200, gstRate: 18, stock: 25, reorderLevel: 10 },
  ]);

  await StockLedger.create(
    products.map((p) => ({
      product: p._id, qty: p.stock, reason: 'adjustment',
      note: 'Opening stock', balance: p.stock, createdBy: admin._id,
    }))
  );

  await Party.create([
    { type: 'supplier', name: 'ABC Traders', phone: '9876543210', gstin: '33ABCDE1234F1Z5' },
    { type: 'supplier', name: 'Metro Wholesale', phone: '9876500000' },
    { type: 'customer', name: 'XYZ Stores', phone: '9123456780', address: 'Madurai' },
    { type: 'customer', name: 'Sri Electronics', phone: '9123400000', address: 'Coimbatore' },
  ]);

  console.log('Seed complete');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });