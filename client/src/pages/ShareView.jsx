// client/src/pages/ShareView.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ShareView = () => {
  const { publicId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const fetchShared = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/share/${publicId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Shared note not found');
          throw new Error('Failed to fetch shared note');
        }
        const data = await res.json();
        setNote(data);
      } catch (e) {
        console.error('Fetch shared note error', e);
        setErr(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [publicId]);

  if (loading) return <div style={{ padding: 20 }}>Loading shared note…</div>;
  if (err) return <div style={{ padding: 20, color: 'red' }}>{err}</div>;

  return (
    <main style={{ maxWidth: 900, margin: '20px auto', padding: 20 }}>
      <h1 style={{ marginBottom: 8 }}>{note.title}</h1>

      {/* optional preview image using local path for testing */}
      {note.previewImage && (
        <img src={note.previewImage} alt="preview" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 12 }} />
      )}

      <div style={{ marginTop: 12 }}>
        <ReactMarkdown>{note.content || ''}</ReactMarkdown>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div style={{ marginTop: 12, color: '#6b7280' }}>
          Tags: {note.tags.join(', ')}
        </div>
      )}
    </main>
  );
};

export default ShareView;

