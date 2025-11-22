// client/src/pages/TrashPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const TrashPage = () => {
  const [trashed, setTrashed] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notes/trash/list');
      setTrashed(res.data);
    } catch (err) {
      console.error('Error fetching trash', err);
      alert('Failed to load Trash. Check console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id) => {
    try {
      await api.post(`/api/notes/${id}/restore`);
      setTrashed((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Restore failed', err);
      alert('Restore failed. Check console.');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Delete permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/api/notes/${id}/permanent`);
      setTrashed((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Permanent delete failed', err);
      alert('Delete failed. Check console.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Trash</h2>
      {loading ? (
        <p>Loading...</p>
      ) : trashed.length === 0 ? (
        <p>Trash is empty.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {trashed.map((note) => (
            <li key={note._id} style={{ marginBottom: '10px', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{note.title || 'Untitled'}</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Deleted: {new Date(note.deletedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleRestore(note._id)}>Restore</button>
                  <button onClick={() => handlePermanentDelete(note._id)} style={{ background: 'red', color: 'white' }}>Delete Forever</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrashPage;

