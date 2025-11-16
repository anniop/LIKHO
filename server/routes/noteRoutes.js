const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here are protected
router.use(auth);

// GET /api/notes  -> list notes of logged-in user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notes
router.post('/', async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const note = await Note.create({
      owner: req.user.id,
      title: title || 'Untitled',
      content: content || '',
      tags: tags || []
    });
    res.status(201).json(note);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notes/:id  -> full update
router.put('/:id', async (req, res) => {
  try {
    const { title, content, tags, isPinned, isArchived } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { title, content, tags, isPinned, isArchived },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
