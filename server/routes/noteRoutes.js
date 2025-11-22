// server/routes/noteRoutes.js
const express = require('express');
const crypto = require('crypto');
const Note = require('../models/Note');
const auth = require('../middleware/authMiddleware');
const puppeteer = require('puppeteer');

const router = express.Router();

// 🔒 All routes are protected
router.use(auth);

/* ----------------------------------------------------------
   LIST / SPECIAL (non-:id) ROUTES - PLACE BEFORE /:id
---------------------------------------------------------- */

// GET /api/notes -> list non-deleted, non-archived notes, pinned first
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({
      owner: req.user.id,
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    }).sort({ isPinned: -1, updatedAt: -1 }); // pinned first
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List trashed notes
router.get('/trash/list', async (req, res) => {
  try {
    const trashed = await Note.find({
      owner: req.user.id,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    res.json(trashed);
  } catch (err) {
    console.error('Get trash list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------
   SHARE / PUBLIC CONTROL (protected endpoints to create/uncreate)
---------------------------------------------------------- */

/**
 * POST /api/notes/:id/share
 * Generates or returns an existing publicId and marks note as public.
 */
router.post('/:id/share', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (!note.publicId) {
      // url-safe random token (~12 chars)
      note.publicId = crypto.randomBytes(9).toString('base64url');
    }
    note.isPublic = true;
    await note.save();

    const base = process.env.CLIENT_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
    const publicUrl = `${base}/share/${note.publicId}`;

    // Example preview image (your uploaded file path)
    const previewImage = '/mnt/data/034f8799-0ff6-402d-bc44-892f798f135e.png';

    res.json({ message: 'Note is now public', publicUrl, publicId: note.publicId, previewImage });
  } catch (err) {
    console.error('Share note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/notes/:id/unshare
 * Turns off public access.
 */
router.post('/:id/unshare', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.isPublic = false;
    note.publicId = null;
    await note.save();

    res.json({ message: 'Note unshared' });
  } catch (err) {
    console.error('Unshare note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------
   ACTION ROUTES (pin, create, update, trash, restore, permanent)
---------------------------------------------------------- */

// Toggle pin/unpin
router.post('/:id/toggle-pin', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.isPinned = !note.isPinned;
    await note.save();

    res.json({ message: note.isPinned ? 'Pinned' : 'Unpinned', note });
  } catch (err) {
    console.error('Toggle pin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notes -> create
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
    res.status(500).json({ message: 'Server error while creating note' });
  }
});

// PUT /api/notes/:id -> update fields
router.put('/:id', async (req, res) => {
  try {
    const { title, content, tags, isPinned, isArchived, isPublic } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { title, content, tags, isPinned, isArchived, isPublic },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------
   TRASH / RESTORE / PERMANENT
---------------------------------------------------------- */

// Move to Trash (soft delete)
router.post('/:id/trash', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note moved to Trash', note });
  } catch (err) {
    console.error('Trash note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore from Trash
router.post('/:id/restore', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found in Trash' });
    res.json({ message: 'Note restored', note });
  } catch (err) {
    console.error('Restore note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Permanently delete (only from Trash)
router.delete('/:id/permanent', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
      isDeleted: true
    });
    if (!note) return res.status(404).json({ message: 'Note not found in Trash' });
    res.json({ message: 'Note permanently deleted' });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------
   GET SINGLE NOTE (PARAMETER ROUTE) - PUT LAST
---------------------------------------------------------- */

// GET /api/notes/:id -> load single note (only if not deleted)
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isDeleted: { $ne: true }
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notes/:id/pdf  -> returns PDF of the note (protected)

router.get('/:id/pdf', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id, isDeleted: { $ne: true } });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Simple HTML template - you can enhance with CSS
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(note.title || 'Untitled')}</title>
        <style>
          body { font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 28px; color: #111; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
          .content { font-size: 14px; line-height: 1.5; }
          pre { background:#f5f5f5; padding:10px; border-radius:6px; overflow:auto; }
          code { font-family: monospace; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(note.title || 'Untitled')}</h1>
        <div class="meta">Updated: ${new Date(note.updatedAt).toLocaleString()}</div>
        <div class="content">${markdownToHtml(note.content || '')}</div>
      </body>
      </html>
    `;

    // Launch puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '16mm', right: '16mm' } });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="${(note.title || 'note').replace(/[^a-z0-9_\-]/gi,'_')}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// small helpers (place near top of file)
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// lightweight markdown -> HTML converter using 'marked' if available,
// otherwise very simple newline-><p> fallback.
// Recommended: install 'marked' package (npm i marked) and import it.
const marked = require('marked'); // npm i marked
function markdownToHtml(md) {
  if (!md) return '';
  try {
    return marked.parse(md);
  } catch (e) {
    // fallback simple:
    return md.split('\n').map(l => `<p>${escapeHtml(l)}</p>`).join('');
  }
}


module.exports = router;

