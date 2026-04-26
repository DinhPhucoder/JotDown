import { useCallback, useMemo, useRef, useState } from 'react';
import { normalizeLabels, normalizeSecurityState } from '../utils/noteNormalizers';

const AUTOSAVE_DELAY_MS = 700;

// ─── Snapshot helpers ─────────────────────────────────────────────────────────

function createDraftSnapshot(
  nextTitle,
  nextContent,
  nextPinned,
  nextImages,
  nextLabels,
  nextSharedWith,
  nextLocked,
  nextLockPassword,
) {
  const normalizedState = normalizeSecurityState(nextLocked, nextLockPassword, nextSharedWith);

  return JSON.stringify({
    title: nextTitle,
    content: nextContent,
    isPinned: nextPinned,
    images: nextImages,
    labels: normalizeLabels(nextLabels).sort((a, b) => a.localeCompare(b)),
    isLocked: normalizedState.isLocked,
    lockPassword: normalizedState.lockPassword,
    sharedWith: normalizedState.sharedWith
      .map((e) => ({ email: e.email, permission: e.permission }))
      .sort((a, b) => a.email.localeCompare(b.email)),
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages note editor draft state:
 * - Initializes state from a source note (or blank for new notes)
 * - Tracks dirty status via snapshot comparison
 * - Exposes buildDraft() to assemble the current draft into a saveable note object
 *
 * Auto-save is NOT included here — the consumer (NoteEditorModal) handles the
 * setTimeout/clearTimeout cycle using isDirty + buildDraft, keeping side-effects
 * visible in the component.
 *
 * @param {{ note: object|null, defaultColor: string }} options
 */
export function useNoteDraft({ note, defaultColor }) {
  const initialTitle = note?.title || '';
  const initialContent = note?.content || '';
  const initialPinned = Boolean(note?.isPinned);
  const initialImages = Array.isArray(note?.images) ? note.images.filter(Boolean).slice(0, 3) : [];
  const initialLabels = normalizeLabels(note?.labels);
  const initialSecurityState = normalizeSecurityState(
    note?.isLocked,
    typeof note?.lockPassword === 'string' ? note.lockPassword : '',
    note?.sharedWith,
  );
  const initialSharedWith = initialSecurityState.sharedWith;
  const initialIsLocked = initialSecurityState.isLocked;
  const initialLockPassword = initialSecurityState.lockPassword;
  const initialUpdatedAt = note?.updatedAt || new Date().toISOString();

  const [title, setTitle] = useState(() => initialTitle);
  const [content, setContent] = useState(() => initialContent);
  const [isPinned] = useState(() => initialPinned);
  const [images, setImages] = useState(() => initialImages);
  const [selectedLabels, setSelectedLabels] = useState(() => initialLabels);
  const [sharedWith, setSharedWith] = useState(() => initialSharedWith);
  const [isLocked, setIsLocked] = useState(() => initialIsLocked);
  const [lockPassword, setLockPassword] = useState(() => initialLockPassword);
  const [lastEditedAt, setLastEditedAt] = useState(() => initialUpdatedAt);

  const noteIdRef = useRef(note?.id || null);

  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    createDraftSnapshot(
      initialTitle.trim(),
      initialContent.trim(),
      initialPinned,
      initialImages,
      initialLabels,
      initialSharedWith,
      initialIsLocked,
      initialLockPassword,
    ),
  );

  const currentSnapshot = createDraftSnapshot(
    title.trim(),
    content.trim(),
    isPinned,
    images,
    selectedLabels,
    sharedWith,
    isLocked,
    lockPassword,
  );

  const hasMeaningfulData = Boolean(
    title.trim() ||
      content.trim() ||
      isPinned ||
      images.length > 0 ||
      selectedLabels.length > 0 ||
      sharedWith.length > 0 ||
      isLocked,
  );

  const isDirty = hasMeaningfulData && currentSnapshot !== savedSnapshot;

  const buildDraft = useCallback(
    (now) => {
      const id = noteIdRef.current || crypto.randomUUID();
      noteIdRef.current = id;
      const normalizedState = normalizeSecurityState(isLocked, lockPassword, sharedWith);

      return {
        id,
        title: title.trim(),
        content: content.trim(),
        color: note?.color || defaultColor || 'default',
        isPinned,
        pinnedAt: isPinned ? note?.pinnedAt || now : undefined,
        isLocked: normalizedState.isLocked,
        lockPassword: normalizedState.lockPassword,
        labels: normalizeLabels(selectedLabels),
        images,
        sharedWith: normalizedState.sharedWith,
        createdAt: note?.createdAt || now,
        updatedAt: now,
      };
    },
    [title, content, note, defaultColor, isPinned, isLocked, lockPassword, selectedLabels, images, sharedWith],
  );

  function commitDraft(draft) {
    setSavedSnapshot(
      createDraftSnapshot(
        draft.title,
        draft.content,
        draft.isPinned,
        draft.images,
        draft.labels,
        draft.sharedWith,
        draft.isLocked,
        draft.lockPassword,
      ),
    );
    setLastEditedAt(draft.updatedAt || new Date().toISOString());
  }

  const normalizedAvailableLabels = useMemo(
    () => normalizeLabels(note?.labels || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function handleToggleLabel(labelName) {
    const normalized = String(labelName || '').trim();

    if (!normalized) {
      return;
    }

    setSelectedLabels((current) =>
      current.includes(normalized)
        ? current.filter((label) => label !== normalized)
        : [...current, normalized],
    );
  }

  const remainingImageSlots = Math.max(3 - images.length, 0);
  const canManageCollaborators = !isLocked;
  const canManageLock = sharedWith.length === 0;

  return {
    // State
    title, setTitle,
    content, setContent,
    isPinned,
    images, setImages,
    selectedLabels, setSelectedLabels,
    sharedWith, setSharedWith,
    isLocked, setIsLocked,
    lockPassword, setLockPassword,
    lastEditedAt,
    // Computed
    isDirty,
    remainingImageSlots,
    canManageCollaborators,
    canManageLock,
    normalizedAvailableLabels,
    // Actions
    buildDraft,
    commitDraft,
    handleToggleLabel,
    AUTOSAVE_DELAY_MS,
  };
}
