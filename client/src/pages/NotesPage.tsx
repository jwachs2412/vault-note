import { useState, useEffect } from 'react';
import type { Note } from '../types';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export function NotesPage() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      setIsLoading(true);
      const data = await api.getNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length === 0) return;

    try {
      const newNote = await api.createNote({
        title: title.trim(),
        content: content.trim(),
      });
      setNotes((prev) => [newNote, ...prev]);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  }

  function handleSelect(note: Note) {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNote || title.trim().length === 0) return;

    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: title.trim(),
        content: content.trim(),
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(null);
      setTitle('');
      setContent('');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this note?')) return;

    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }

  function handleCancel() {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setIsEditing(false);
  }

  return (
    <div className="notes-page">
      <header className="notes-header">
        <div>
          <h1>VaultNote</h1>
          <p>{user?.email}</p>
        </div>
        <button className="logout-button" onClick={logout}>
          Log Out
        </button>
      </header>

      <div className="notes-layout">
        <section className="notes-sidebar">
          <h2>Your Notes</h2>
          {isLoading ? (
            <p className="loading">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="empty-state">No notes yet. Create one!</p>
          ) : (
            <div className="note-list">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`note-card ${selectedNote?.id === note.id ? 'active' : ''}`}
                  onClick={() => handleSelect(note)}
                >
                  <div className="note-card-content">
                    <h3>{note.title}</h3>
                    <p>
                      {note.content.substring(0, 80)}
                      {note.content.length > 80 ? '...' : ''}
                    </p>
                    <time>
                      {new Date(note.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    title="Delete note"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="notes-editor">
          <form onSubmit={isEditing ? handleUpdate : handleCreate}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="note-title-input"
              maxLength={200}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              className="note-content-input"
              rows={12}
            />
            <div className="editor-actions">
              {isEditing && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="submit-button"
                disabled={title.trim().length === 0}
              >
                {isEditing ? 'Save Changes' : 'Create Note'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
