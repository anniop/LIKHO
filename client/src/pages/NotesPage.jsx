import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

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
            <li key={note._id} style={{ marginBottom: '10px' }}>
              <Link to={`/notes/${note._id}`}>
                {note.title || 'Untitled'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotesPage;
