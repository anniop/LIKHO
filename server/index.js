// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));

// Optional: serve static test images (copy your image into server/public and uncomment)
// app.use('/static', express.static(path.join(__dirname, 'public')));

const mountRoutes = () => {
  // Mount your protected API routes after DB connection
  const noteRoutes = require('./routes/noteRoutes');
  app.use('/api/notes', noteRoutes);

  // Public share route
  app.get('/share/:publicId', async (req, res) => {
    try {
      const Note = require('./models/Note');
      const note = await Note.findOne({
        publicId: req.params.publicId,
        isPublic: true,
        isDeleted: { $ne: true }
      });
      if (!note) return res.status(404).json({ message: 'Shared note not found' });

      res.json({
        title: note.title,
        content: note.content,
        tags: note.tags,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        // Local preview image for testing; in production serve from static or CDN
        previewImage: '/mnt/data/034f8799-0ff6-402d-bc44-892f798f135e.png'
      });
    } catch (err) {
      console.error('Public share fetch error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // mount other routers (auth, users) here if needed
};

const start = async () => {
  const MONGO = process.env.MONGO_URI;
  if (!MONGO) {
    console.error('MONGO_URI not set. Add it to server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...', MONGO.replace(/(\/\/.*:)(.*?)(@)/, '$1*****$3'));
    // modern driver does not need useNewUrlParser/useUnifiedTopology
    await mongoose.connect(MONGO, {
      serverSelectionTimeoutMS: 5000 // fail fast if Atlas not reachable
    });

    console.log('MongoDB connected');

    // Now it's safe to mount routes that depend on the DB
    mountRoutes();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    // Provide clearer guidance for the common Atlas errors
    console.error('Failed to connect to MongoDB:', err);
    if (err && err.reason && err.reason.type) {
      console.error('Topology reason:', err.reason.type);
    }
    if (err && err.message) {
      // If it's an IP whitelist issue, the message often hints at it
      if (err.message.includes('whitelist') || err.message.includes('IP')) {
        console.error('Likely cause: your IP is not whitelisted in Atlas. Add your IP in Atlas > Network Access.');
      } else if (err.message.includes('authentication')) {
        console.error('Likely cause: wrong username/password in MONGO_URI.');
      } else {
        console.error('See the detailed error above for more info.');
      }
    }
    process.exit(1);
  }
};

start();

