import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette, faThumbtack, faTrash } from '@fortawesome/free-solid-svg-icons';
import { noteColorOptions } from '../../data/noteWorkspace';

function createDraftSnapshot(nextTitle, nextContent, nextColor, nextPinned) {
  return JSON.stringify({
    title: nextTitle,
    content: nextContent,
    color: nextColor,
    isPinned: nextPinned,
  });
}

function NoteEditorModal({ note, open, defaultColor, onClose, onDelete, onSave }) {
  const initialTitle = note?.title || '';
  const initialContent = note?.content || '';
  const initialColor = note?.color || defaultColor;
  const initialPinned = Boolean(note?.isPinned);
  const [title, setTitle] = useState(() => initialTitle);
  const [content, setContent] = useState(() => initialContent);
  const [color, setColor] = useState(() => initialColor);
  const [isPinned, setIsPinned] = useState(() => initialPinned);
  const [showPalette, setShowPalette] = useState(false);
  const noteIdRef = useRef(note?.id || null);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    createDraftSnapshot(initialTitle.trim(), initialContent.trim(), initialColor, initialPinned),
  );

  const currentSnapshot = createDraftSnapshot(title.trim(), content.trim(), color, isPinned);
  const isDirty =
    Boolean(title.trim() || content.trim()) && currentSnapshot !== savedSnapshot;

  useEffect(() => {
    if (!open || !isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const now = new Date().toISOString();
      const id = noteIdRef.current || crypto.randomUUID();
      noteIdRef.current = id;
      const draft = {
        id,
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        pinnedAt: isPinned ? note?.pinnedAt || now : undefined,
        isLocked: note?.isLocked || false,
        labels: note?.labels || [],
        images: note?.images || [],
        sharedWith: note?.sharedWith || [],
        createdAt: note?.createdAt || now,
        updatedAt: now,
      };
      onSave(draft);
      setSavedSnapshot(createDraftSnapshot(draft.title, draft.content, draft.color, draft.isPinned));
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, isDirty, title, content, color, isPinned, note, onSave]);

  function handleHide() {
    if (open && isDirty) {
      const now = new Date().toISOString();
      const id = noteIdRef.current || crypto.randomUUID();
      noteIdRef.current = id;
      const draft = {
        id,
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        pinnedAt: isPinned ? note?.pinnedAt || now : undefined,
        isLocked: note?.isLocked || false,
        labels: note?.labels || [],
        images: note?.images || [],
        sharedWith: note?.sharedWith || [],
        createdAt: note?.createdAt || now,
        updatedAt: now,
      };
      onSave(draft);
      setSavedSnapshot(createDraftSnapshot(draft.title, draft.content, draft.color, draft.isPinned));
    }

    onClose();
  }

  function handleDelete() {
    if (!note) {
      return;
    }

    onDelete(note.id);
    onClose();
  }

  return (
    <Modal show={open} onHide={handleHide} centered dialogClassName="note-editor-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>{note ? 'Chinh sua ghi chu' : 'Tao ghi chu moi'}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        <input
          type="text"
          className="note-editor__title"
          placeholder="Tieu de"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="note-editor__content"
          rows={10}
          placeholder="Noi dung ghi chu..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        <div className="note-editor__toolbar">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className={`notes-icon-btn ${isPinned ? 'active' : ''}`}
              onClick={() => setIsPinned((current) => !current)}
              title={isPinned ? 'Bo ghim' : 'Ghim ghi chu'}
            >
              <FontAwesomeIcon icon={faThumbtack} />
            </button>

            <div className="position-relative">
              <button
                type="button"
                className={`notes-icon-btn ${showPalette ? 'active' : ''}`}
                onClick={() => setShowPalette((current) => !current)}
                title="Doi mau ghi chu"
              >
                <FontAwesomeIcon icon={faPalette} />
              </button>

              {showPalette ? (
                <div className="note-editor__palette">
                  {noteColorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`note-swatch ${color === option.value ? 'active' : ''}`}
                      style={{ background: option.swatch }}
                      onClick={() => {
                        setColor(option.value);
                        setShowPalette(false);
                      }}
                      aria-label={option.label}
                      title={option.label}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {note ? (
              <button type="button" className="notes-icon-btn notes-icon-btn--danger" onClick={handleDelete}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            ) : null}
          </div>

          <span className="note-editor__status">{isDirty ? 'Dang luu...' : 'Da luu'}</span>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" onClick={handleHide}>
          Dong
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NoteEditorModal;
