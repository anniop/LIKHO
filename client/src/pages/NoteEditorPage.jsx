// client/src/pages/NoteEditorPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import ReactMarkdown from 'react-markdown';

const NoteEditorPage = () => {
  const { id } = useParams(); // <-- id is read here
  const navigate = useNavigate();

  const [note, setNote] = useState({
    title: '',
    content: '',
    tags: [],
    isPinned: false,
  });

  const [tagsInput, setTagsInput] = useState('');
  const [publicUrl, setPublicUrl] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [tab, setTab] = useState('edit');
  const [initialized, setInitialized] = useState(false);

  // fetch the note
  const fetchNote = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.get(`/api/notes/${id}`);
      const data = res.data;

      if (!data || !data._id) {
        setLoadError('Note not found.');
        return;
      }

      setNote({
        title: data.title || '',
        content: data.content || '',
        tags: data.tags || [],
        isPinned: !!data.isPinned,
      });

      setTagsInput((data.tags || []).join(', '));
      if (data.isPublic && data.publicId) {
        const base = import.meta.env.VITE_CLIENT_BASE || 'http://localhost:5173';
        setPublicUrl(`${base}/share/${data.publicId}`);
      } else {
        setPublicUrl(null);
      }

      setInitialized(true);
    } catch (err) {
      console.error('Error fetching note', err);
      setLoadError(
        err?.response?.status === 404
          ? 'Note not found.'
          : 'Failed to load note. Check console for details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTitleChange = (e) => setNote((prev) => ({ ...prev, title: e.target.value }));
  const handleContentChange = (e) => setNote((prev) => ({ ...prev, content: e.target.value }));
  const handleTagsChange = (e) => setTagsInput(e.target.value);

  const parseTags = () =>
    tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const saveNote = async () => {
    try {
      setSaving(true);
      setAutoSaveStatus('saving');

      const payload = {
        ...note,
        tags: parseTags(),
      };

      await api.put(`/api/notes/${id}`, payload);
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Error saving note', err);
      setAutoSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // autosave effect
  useEffect(() => {
    if (!initialized) return;
    setAutoSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      saveNote();
    }, 800);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.title, note.content, tagsInput]);

  const handleManualSave = async () => await saveNote();

  // delete => move to Trash (soft delete)
  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.post(`/api/notes/${id}/trash`);
      navigate('/notes');
    } catch (err) {
      console.error('Error moving note to Trash', err);
      alert('Failed to move note to Trash. Check console.');
    }
  };

  // Toggle pin from editor
  const handleTogglePinEditor = async () => {
    try {
      // optimistic update
      setNote((prev) => ({ ...prev, isPinned: !prev.isPinned }));
      await api.post(`/api/notes/${id}/toggle-pin`);
      // refresh
      fetchNote();
    } catch (err) {
      console.error('Failed to toggle pin from editor', err);
      alert('Failed to toggle pin. Check console.');
      fetchNote();
    }
  };

  // Share / Unshare handlers
  const handleShare = async () => {
    try {
      setSharing(true);
      const res = await api.post(`/api/notes/${id}/share`);
      setPublicUrl(res.data.publicUrl);
      alert('Public link created. You can copy it now.');
    } catch (err) {
      console.error('Share failed', err);
      alert('Failed to create share link. Check console.');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    if (!window.confirm('Disable public link?')) return;
    try {
      await api.post(`/api/notes/${id}/unshare`);
      setPublicUrl(null);
      alert('Public link disabled.');
    } catch (err) {
      console.error('Unshare failed', err);
      alert('Failed to disable share. Check console.');
    }
  };

  const handleCopyPublicUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      alert('Copied public link to clipboard');
    } catch {
      alert('Could not copy to clipboard — manually copy the link.');
    }
  };

  // ---------- PDF download handler (fixed: uses `id` from useParams and `note` state) ----------
  const handleDownloadPdf = async () => {
    try {
      // fetch the PDF from server endpoint (protected)
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}/pdf`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        // try to read error JSON for helpful message
        let body = null;
        try { body = await res.json(); } catch (e) {}
        throw new Error(body?.message || `Failed to generate PDF (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(note.title || 'note').replace(/[^a-z0-9_\-]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error', err);
      alert(`Failed to generate PDF: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading note...</div>;
  if (loadError) return (
    <div style={{ padding: '20px' }}>
      <p style={{ color: 'red' }}>{loadError}</p>
      <button onClick={() => navigate('/notes')}>Back to notes</button>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      {/* Title row with pin button */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <input
          type="text"
          name="title"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Title"
          style={{
            fontSize: '1.4rem',
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #ddd',
          }}
        />
        <button
          onClick={handleTogglePinEditor}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            background: note.isPinned ? '#fff7ed' : '#f3f4f6',
            cursor: 'pointer',
          }}
        >
          {note.isPinned ? '📌 Pinned' : '📍 Pin'}
        </button>
      </div>

      {/* Tags input */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={handleTagsChange}
          placeholder="work, ideas, personal"
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '0.95rem',
          }}
        />
      </div>

      {/* Share controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        {publicUrl ? (
          <>
            <input readOnly value={publicUrl} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <button onClick={handleCopyPublicUrl}>Copy</button>
            <button onClick={handleUnshare} style={{ background: 'red', color: 'white' }}>Disable</button>
          </>
        ) : (
          <button onClick={handleShare} disabled={sharing}>
            {sharing ? 'Sharing...' : 'Create public link'}
          </button>
        )}
      </div>

      {/* PDF + Tabs + status */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div>
          <button onClick={handleDownloadPdf} style={{ marginRight: 8 }}>Download PDF</button>
          <button
            type="button"
            onClick={() => setTab('edit')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: tab === 'edit' ? '#e5e7eb' : '#f9fafb',
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: tab === 'preview' ? '#e5e7eb' : '#f9fafb',
              marginLeft: '6px',
            }}
          >
            Preview
          </button>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#6b7280' }}>
          {autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'All changes saved' : autoSaveStatus === 'error' ? 'Error while saving' : ''}
        </div>
      </div>

      {/* Editor / Preview */}
      {tab === 'edit' ? (
        <textarea
          name="content"
          value={note.content}
          onChange={handleContentChange}
          placeholder="Write your note in Markdown..."
          rows={20}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
            fontSize: '0.95rem',
          }}
        />
      ) : (
        <div
          style={{
            minHeight: '200px',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            background: '#f9fafb',
          }}
        >
          {note.content.trim() ? (
            <ReactMarkdown>{note.content}</ReactMarkdown>
          ) : (
            <p style={{ color: '#888' }}>Nothing to preview yet…</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
        <button onClick={handleManualSave} disabled={saving} style={{ padding: '8px 12px' }}>
          {saving ? 'Saving...' : 'Save now'}
        </button>

        <button
          onClick={handleDelete}
          style={{
            color: 'white',
            background: 'red',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default NoteEditorPage;

