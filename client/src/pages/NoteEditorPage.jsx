import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import ReactMarkdown from 'react-markdown';

const NoteEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState({
    title: '',
    content: '',
    tags: [],
  });

  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [tab, setTab] = useState('edit');
  const [initialized, setInitialized] = useState(false);

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
      });

      setTagsInput((data.tags || []).join(', '));
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching note', err);
      setLoadError(
        err.response?.status === 404
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
  }, [id]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setNote((prev) => ({ ...prev, title: value }));
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    setNote((prev) => ({ ...prev, content: value }));
  };

  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
  };

  const parseTags = () => {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  };

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

  useEffect(() => {
    if (!initialized) return;
    setAutoSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      saveNote();
    }, 800);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.title, note.content, tagsInput]);

  const handleManualSave = async () => {
    await saveNote();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/api/notes/${id}`);
      navigate('/notes');
    } catch (err) {
      console.error('Error deleting note', err);
      alert('Failed to delete note. Check console for details.');
    }
  };

  const renderStatus = () => {
    if (autoSaveStatus === 'saving') return 'Saving...';
    if (autoSaveStatus === 'saved') return 'All changes saved';
    if (autoSaveStatus === 'error') return 'Error while saving';
    return '';
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading note...</div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>{loadError}</p>
        <button onClick={() => navigate('/notes')}>Back to notes</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div>
        <input
          type="text"
          name="title"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Title"
          style={{
            fontSize: '1.4rem',
            width: '100%',
            marginBottom: '10px',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={handleTagsChange}
          placeholder="work, ideas, personal"
          style={{
            width: '100%',
            padding: '6px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '0.9rem',
          }}
        />
      </div>

      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <div>
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
          {renderStatus()}
        </div>
      </div>

      {tab === 'edit' ? (
        <textarea
          name="content"
          value={note.content}
          onChange={handleContentChange}
          placeholder="Write your note in Markdown..."
          rows={20}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
          }}
        />
      ) : (
        <div
          style={{
            minHeight: '200px',
            padding: '10px',
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

      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={handleManualSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save now'}
        </button>
        <button
          onClick={handleDelete}
          style={{
            color: 'white',
            background: 'red',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default NoteEditorPage;

