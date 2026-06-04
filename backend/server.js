const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:3000'] : '*',
  })
);
app.use(express.json());

// Routes
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/', (req, res) => res.json({ message: 'API running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
