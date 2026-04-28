/**
 * Barrel export for the notes feature.
 * Import from here to avoid deep relative paths.
 *
 * @example
 *   import { NoteCard, NotesSidebar } from '../features/notes';
 */

// Components
export { default as NoteCard } from './components/NoteCard';
export { default as NoteCollaboratorsModal } from './components/NoteCollaboratorsModal';
export { default as NoteDeleteConfirmDialog } from './components/NoteDeleteConfirmDialog';
export { default as NoteEditorModal } from './components/NoteEditorModal';
export { default as NoteSettingsModal } from './components/NoteSettingsModal';
export { default as NotesHeader } from './components/NotesHeader';
export { default as NotesSidebar } from './components/NotesSidebar';

// Hooks
export { useNoteWorkspace } from './hooks/useNoteWorkspace';
export { useLabelManager } from './hooks/useLabelManager';
export { useNoteFilters } from './hooks/useNoteFilters';
export { useNoteDraft } from './hooks/useNoteDraft';

// Utils
export { sortNotes } from './utils/noteSorter';
export { resolveNoteShareMeta } from './utils/noteShareResolver';
export { normalizeLabels, normalizeSharedWith, normalizeSecurityState } from './utils/noteNormalizers';
export { resizeImageFile } from './utils/imageResizer';
