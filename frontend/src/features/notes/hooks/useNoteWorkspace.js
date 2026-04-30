import { useEffect, useState } from 'react';
import { loadNoteWorkspace, saveNoteWorkspace } from '../../../services/workspaceStorage';
import { sortNotes } from '../utils/noteSorter';

function resolveNoteFontSize(value) {
  return value === 'small' || value === 'large' ? value : 'medium';
}

/**
 * Manages the complete note workspace state:
 * notes, labels, user, viewMode — with localStorage persistence.
 * Also exposes CRUD operations for notes and user preferences.
 *
 * @returns {{
 *   notes, setNotes,
 *   labels, setLabels,
 *   user, setUser,
 *   viewMode, setViewMode,
 *   handleSave, handleDelete, handleTogglePin, updatePreferences
 * }}
 */
export function useNoteWorkspace() {
  const [initialWorkspace] = useState(() => loadNoteWorkspace());
  const [notes, setNotes] = useState(() => {
    if (localStorage.getItem('auth_token')) {
      return [];
    }
    return sortNotes(initialWorkspace.notes);
  });
  const [labels, setLabels] = useState(() => initialWorkspace.labels);
  const [user, setUser] = useState(() => initialWorkspace.user);
  const [viewMode, setViewMode] = useState(() => initialWorkspace.viewMode);

  useEffect(() => {
    saveNoteWorkspace({ notes, labels, user, viewMode });
  }, [notes, labels, user, viewMode]);

  function handleSave(nextNote) {
    setNotes((current) => {
      const index = current.findIndex((item) => item.id === nextNote.id);

      if (index === -1) {
        return sortNotes([nextNote, ...current]);
      }

      const next = [...current];
      next[index] = nextNote;
      return sortNotes(next);
    });
  }

  function handleDelete(noteId) {
    setNotes((current) => current.filter((item) => item.id !== noteId));
  }

  function handleTogglePin(noteId) {
    setNotes((current) =>
      sortNotes(
        current.map((note) =>
          note.id === noteId
            ? {
                ...note,
                isPinned: !note.isPinned,
                pinnedAt: !note.isPinned ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString(),
              }
            : note,
        ),
      ),
    );
  }

  function updatePreferences(nextPreferences) {
    const nextDefaultColor = String(nextPreferences?.defaultNoteColor || '').trim();
    const shouldSyncAllNoteColors =
      nextDefaultColor.length > 0 && nextDefaultColor !== user?.preferences?.defaultNoteColor;

    setUser((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        ...nextPreferences,
        fontSize: resolveNoteFontSize(nextPreferences?.fontSize),
      },
    }));

    if (!shouldSyncAllNoteColors) {
      return;
    }

    setNotes((current) =>
      current.map((note) =>
        note.color === nextDefaultColor ? note : { ...note, color: nextDefaultColor },
      ),
    );
  }

  return {
    notes,
    setNotes,
    labels,
    setLabels,
    user,
    setUser,
    viewMode,
    setViewMode,
    handleSave,
    handleDelete,
    handleTogglePin,
    updatePreferences,
  };
}
