/**
 * @deprecated
 * This file is kept for backward compatibility during the refactoring migration.
 * New code should import directly from:
 *   - src/data/constants.js       (noteColorOptions, fontSizeOptions)
 *   - src/data/mockData.js        (mockUser, mockLabels, mockNotes)
 *   - src/services/workspaceStorage.js (loadNoteWorkspace, saveNoteWorkspace)
 */

export { NOTE_WORKSPACE_STORAGE_KEY, NOTE_WORKSPACE_VERSION, noteColorOptions, fontSizeOptions } from './constants';
export { mockUser, mockLabels, mockNotes } from './mockData';
export { loadNoteWorkspace, saveNoteWorkspace } from '../services/workspaceStorage';
