// server/models/Note.js
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'Untitled'
    },
    content: {
      type: String,
      default: '' // markdown text
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isPinned: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },

    // Soft-delete fields
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    isPublic: { type: Boolean, default: false },
    publicId: { type: String, default: null } // random token used in share URL
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);

