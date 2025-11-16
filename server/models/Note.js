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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);
