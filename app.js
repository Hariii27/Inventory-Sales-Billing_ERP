require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Routes are required before connectDB() so that all models are registered
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/parties', require('./routes/parties'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.get('/health', (req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });