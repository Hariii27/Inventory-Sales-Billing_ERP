const mongoose = require('mongoose');

module.exports = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
  // Ensure collections and indexes exist before any transaction runs
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};