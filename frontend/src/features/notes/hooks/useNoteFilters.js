import { useDeferredValue, useMemo, useState } from 'react';
import { resolveNoteShareMeta } from '../utils/noteShareResolver';
import { sortNotes } from '../utils/noteSorter';

/**
 * Computes filtered and sorted notes based on search, label selection, and share view.
 *
 * @param {object[]} notes
 * @param {string} userEmail
 * @returns {{
 *   search, setSearch,
 *   selectedLabels, showShared,
 *   filteredNotes, pinnedNotes, otherNotes,
 *   ownedSharedNotes, receivedSharedNotes
 * }}
 */
export function useNoteFilters(notes, userEmail, selectedLabels, showShared) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const normalizedUserEmail = String(userEmail || '').trim().toLowerCase();
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredNotes = useMemo(() => {
    const withMeta = notes.map((note) => ({
      ...note,
      __shareMeta: resolveNoteShareMeta(note, normalizedUserEmail),
    }));

    const filtered = withMeta.filter((note) => {
      if (showShared && !note.__shareMeta.isOwnedShared && !note.__shareMeta.isReceivedShared) {
        return false;
      }

      if (selectedLabels.length > 0 && !selectedLabels.some((label) => note.labels.includes(label))) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return `${note.title} ${note.content}`.toLowerCase().includes(normalizedSearch);
    });

    return sortNotes(filtered);
  }, [notes, normalizedUserEmail, selectedLabels, showShared, normalizedSearch]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((note) => note.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((note) => !note.isPinned), [filteredNotes]);
  const ownedSharedNotes = useMemo(
    () => filteredNotes.filter((note) => note.__shareMeta?.isOwnedShared),
    [filteredNotes],
  );
  const receivedSharedNotes = useMemo(
    () => filteredNotes.filter((note) => note.__shareMeta?.isReceivedShared),
    [filteredNotes],
  );

  return {
    search,
    setSearch,
    filteredNotes,
    pinnedNotes,
    otherNotes,
    ownedSharedNotes,
    receivedSharedNotes,
  };
}
