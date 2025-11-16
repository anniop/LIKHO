const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// connect to MongoDB
connectDB();

// middlewares
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);

// routes
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// test route
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
