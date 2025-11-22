import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

// add this function near top of NotesPage component:
const handleTogglePin = async (noteId) => {
  try {
    // optimistic UI update
    setNotes((prev) =>
      prev.map((n) => (n._id === noteId ? { ...n, isPinned: !n.isPinned } : n))
    );

    await api.post(`/api/notes/${noteId}/toggle-pin`);
    // optionally refetch if you want authoritative ordering
    fetchNotes();
  } catch (err) {
    console.error('Failed to toggle pin', err);
    // revert optimistic change on error
    fetchNotes();
    alert('Failed to toggle pin. Check console.');
  }
};

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notes');
      setNotes(res.data);
    } catch (err) {
      console.error('Error fetching notes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await api.post('/api/notes', {
        title: 'Untitled',
        content: ''
      });
      navigate(`/notes/${res.data._id}`);
    } catch (err) {
      console.error('Error creating note', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Your Notes</h2>
      <button onClick={handleCreate} style={{ marginBottom: '15px' }}>
        + New Note
      </button>
      {loading ? (
        <p>Loading...</p>
      ) : notes.length === 0 ? (
        <p>No notes yet. Create one!</p>
      ) : (
        <ul>
          {notes.map((note) => (
           <li key={note._id} style={{ marginBottom: '10px', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Link to={`/notes/${note._id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {note.title || 'Untitled'}
      </div>
      {note.tags && note.tags.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {note.tags.map((tag) => (
            <span key={tag} style={{ display: 'inline-block', padding: '2px 6px', marginRight: '4px', marginTop: '4px', borderRadius: '999px', border: '1px solid #d1d5db', background: '#f3f4f6' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>

    <div style={{ marginLeft: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={() => handleTogglePin(note._id)}
        title={note.isPinned ? 'Unpin' : 'Pin'}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {note.isPinned ? '📌' : '📍'}
      </button>
    </div>
  </div>
</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotesPage;
