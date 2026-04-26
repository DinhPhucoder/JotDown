import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faLock, 
  faTag, 
  faTrash, 
  faUserPlus, 
  faXmark, 
} from '@fortawesome/free-solid-svg-icons'; 
import NoteCollaboratorsModal from './NoteCollaboratorsModal';
import NoteDeleteConfirmDialog from './NoteDeleteConfirmDialog';

const collaboratorEmailSuggestions = [
  'dinhphan1209@gmail.com',
  'partner@example.com',
  'manager@example.com',
  'team.design@example.com',
  'product.owner@example.com',
];

function normalizeLabels(entries) {
  const seen = new Set();

  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0)
    .filter((entry) => {
      const key = entry.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

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
    labels: normalizeLabels(nextLabels).sort((left, right) => left.localeCompare(right)),
    isLocked: normalizedState.isLocked,
    lockPassword: normalizedState.lockPassword,
    sharedWith: normalizedState.sharedWith
      .map((entry) => ({
        email: entry.email,
        permission: entry.permission,
      }))
      .sort((left, right) => left.email.localeCompare(right.email)),
  });
}

function normalizeSharedWith(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .map((entry) => ({
      email: String(entry.email || '').trim().toLowerCase(),
      permission: entry.permission === 'edit' ? 'edit' : 'read',
      sharedAt: String(entry.sharedAt || new Date().toISOString()),
    }))
    .filter((entry) => entry.email.length > 0);
}

function normalizeSecurityState(nextLocked, nextLockPassword, nextSharedWith) {
  const normalizedSharedWith = normalizeSharedWith(nextSharedWith);
  const isLocked = Boolean(nextLocked);
  const lockPassword = nextLockPassword ? String(nextLockPassword) : '';

  if (isLocked) {
    return {
      isLocked: true,
      lockPassword,
      sharedWith: [],
    };
  }

  return {
    isLocked: false,
    lockPassword: '',
    sharedWith: normalizedSharedWith,
  };
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const maxSide = 1600;
      const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Khong the xu ly anh'));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      const resizedDataUrl = canvas.toDataURL('image/webp', 0.82);
      URL.revokeObjectURL(imageUrl);
      resolve(resizedDataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Khong the doc anh'));
    };

    image.src = imageUrl;
  });
}

function formatLastEditedText(value) {
  const parsedDate = value ? new Date(value) : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Da chinh sua luc --:--';
  }

  const now = new Date();
  const isToday =
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear();

  const formattedValue = isToday
    ? parsedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : parsedDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return `Da chinh sua luc ${formattedValue}`;
}

function NoteEditorModal({
  note,
  open,
  defaultColor,
  availableLabels = [],
  onClose,
  onDelete,
  onSave,
}) {
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
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isLockSetupOpen, setIsLockSetupOpen] = useState(false);
  const [lockDraftPassword, setLockDraftPassword] = useState('');
  const [lockDraftConfirm, setLockDraftConfirm] = useState('');
  const [lockSetupError, setLockSetupError] = useState('');
  const [labelQuery, setLabelQuery] = useState('');
  const [isLabelPanelOpen, setIsLabelPanelOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const labelPanelRef = useRef(null);
  const noteIdRef = useRef(note?.id || null);

  const normalizedAvailableLabels = useMemo(() => normalizeLabels(availableLabels), [availableLabels]);
  const normalizedLabelQuery = labelQuery.trim().toLowerCase();
  const filteredLabelOptions = normalizedAvailableLabels.filter((label) =>
    label.toLowerCase().includes(normalizedLabelQuery),
  );

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
  const remainingImageSlots = Math.max(3 - images.length, 0);
  const canManageCollaborators = !isLocked;
  const canManageLock = sharedWith.length === 0;

  function setSnapshotFromDraft(draft) {
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

  function handleToggleLabel(labelName) {
    const normalizedLabel = String(labelName || '').trim();

    if (!normalizedLabel) {
      return;
    }

    setSelectedLabels((currentLabels) =>
      currentLabels.includes(normalizedLabel)
        ? currentLabels.filter((label) => label !== normalizedLabel)
        : [...currentLabels, normalizedLabel],
    );
  }

  function handleOpenLockSetup() {
    if (!canManageLock) {
      return;
    }

    setIsLabelPanelOpen(false);
    setLockDraftPassword('');
    setLockDraftConfirm('');
    setLockSetupError('');
    setIsLockSetupOpen(true);
  }

  function handleCancelLockSetup() {
    setIsLockSetupOpen(false);
    setLockDraftPassword('');
    setLockDraftConfirm('');
    setLockSetupError('');
  }

  function handleSaveLockSetup() {
    const password = lockDraftPassword.trim();
    const confirmPassword = lockDraftConfirm.trim();

    if (password.length < 4) {
      setLockSetupError('Mat khau can it nhat 4 ky tu.');
      return;
    }

    if (password !== confirmPassword) {
      setLockSetupError('Hai mat khau khong khop.');
      return;
    }

    setSharedWith([]);
    setIsLocked(true);
    setLockPassword(password);
    setIsLockSetupOpen(false);
    setLockDraftPassword('');
    setLockDraftConfirm('');
    setLockSetupError('');
  }

  function handleRemoveLock() {
    setIsLocked(false);
    setLockPassword('');
    setIsLockSetupOpen(false);
    setLockDraftPassword('');
    setLockDraftConfirm('');
    setLockSetupError('');
  }

  async function handleImageSelect(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0 || remainingImageSlots <= 0) {
      event.target.value = '';
      return;
    }

    const nextFiles = files.slice(0, remainingImageSlots);
    const nextImages = await Promise.all(nextFiles.map((file) => resizeImageFile(file)));
    setImages((currentImages) => [...currentImages, ...nextImages].slice(0, 3));
    event.target.value = '';
  }

  function handleCloseImageViewer() {
    setActiveImage(null);
  }

  useEffect(() => {
    if (!isLabelPanelOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      const target = event.target;

      if (labelPanelRef.current && !labelPanelRef.current.contains(target)) {
        setIsLabelPanelOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isLabelPanelOpen]);

  useEffect(() => {
    const visibleImage = open && !isCollaboratorsOpen && !isLockSetupOpen ? activeImage : null;

    if (!visibleImage) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveImage(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage, open, isCollaboratorsOpen, isLockSetupOpen]);

  useEffect(() => {
    if (!open || !isDirty) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const now = new Date().toISOString();
      const draft = buildDraft(now);
      onSave(draft);
      setSnapshotFromDraft(draft);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, isDirty, buildDraft, onSave]);

  function handleHide() {
    if (open && isDirty) {
      const now = new Date().toISOString();
      const draft = buildDraft(now);
      onSave(draft);
      setSnapshotFromDraft(draft);
    }

    setIsLabelPanelOpen(false);
    setIsLockSetupOpen(false);
    setLockSetupError('');
    onClose();
  }

  function handleDeleteClick() {
    setIsDeleteConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    if (!note || isDeleting) {
      return;
    }

    setIsDeleting(true);
    
    try {
      onDelete(note.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDeleteCancel() {
    setIsDeleteConfirmOpen(false);
  }

  return (
    <>
      <Modal
        show={open && !isCollaboratorsOpen && !isLockSetupOpen}
        onHide={handleHide}
        onExited={handleCloseImageViewer}
        centered
        dialogClassName="note-editor-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>{note ? 'Chinh sua ghi chu' : 'Tao ghi chu moi'}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-3">
          {images.length > 0 ? (
            <div className={`note-editor__media note-editor__media--${Math.min(images.length, 3)}`}>
              {images.map((image, index) => (
                <div
                  key={`${image.slice(0, 24)}-${index}`}
                  className="note-editor__media-item"
                  role="button"
                  tabIndex={0}
                  aria-label="Mo anh dinh kem"
                  onClick={() => setActiveImage(image)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveImage(image);
                    }
                  }}
                >
                  <img src={image} alt={`attachment-${index + 1}`} />
                  <button
                    type="button"
                    className="note-editor__remove-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setImages((currentImages) =>
                        currentImages.filter((_, itemIndex) => itemIndex !== index),
                      );
                    }}
                    aria-label="Xoa anh"
                    title="Xoa anh"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <input
            type="text"
            className="note-editor__title"
            placeholder="Tieu de"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="note-editor__content"
            rows={9}
            placeholder="Noi dung ghi chu..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="d-none"
            onChange={handleImageSelect}
          />

          <div className="note-editor__toolbar">
            <div className="note-editor__toolbar-actions">
              {canManageCollaborators ? (
                <button 
                  type="button" 
                  className={`notes-icon-btn ${sharedWith.length > 0 ? 'active' : ''}`} 
                  onClick={() => setIsCollaboratorsOpen(true)}
                  title="Mo cong tac vien"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                </button>
              ) : null}

              <button
                type="button"
                className={`notes-icon-btn ${selectedLabels.length > 0 ? 'active' : ''}`}
                onClick={() => setIsLabelPanelOpen((current) => !current)}
                title="Gan nhan"
              >
                <FontAwesomeIcon icon={faTag} />
              </button>

              <button
                type="button"
                className="notes-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={remainingImageSlots <= 0}
                title={
                  remainingImageSlots > 0
                    ? `Them anh (${images.length}/3)`
                    : 'Da dat toi da 3 anh'
                }
              >
                <FontAwesomeIcon icon={faImage} />
              </button>

              {canManageLock ? (
                <button
                  type="button"
                  className={`notes-icon-btn ${isLocked ? 'active' : ''}`}
                  onClick={handleOpenLockSetup}
                  title={isLocked ? 'Quan ly khoa' : 'Them khoa'}
                >
                  <FontAwesomeIcon icon={faLock} />
                </button>
              ) : null}

              {note ? (
                <button type="button" className="notes-icon-btn notes-icon-btn--danger" onClick={handleDeleteClick}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              ) : null}

              {isLabelPanelOpen ? (
                <div ref={labelPanelRef} className="note-editor__floating-panel note-editor__floating-panel--labels">
                  <input
                    type="text"
                    className="note-editor__panel-input"
                    placeholder="Tim nhan..."
                    value={labelQuery}
                    onChange={(event) => setLabelQuery(event.target.value)}
                  />
                  <div className="note-editor__panel-list">
                    {filteredLabelOptions.length > 0 ? (
                      filteredLabelOptions.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className={`note-editor__panel-option ${
                            selectedLabels.includes(label) ? 'active' : ''
                          }`}
                          onClick={() => handleToggleLabel(label)}
                        >
                          <span>{label}</span>
                          {selectedLabels.includes(label) ? <span>Da chon</span> : null}
                        </button>
                      ))
                    ) : (
                      <div className="note-editor__panel-empty">Khong tim thay nhan phu hop.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <span className="note-editor__status">{formatLastEditedText(lastEditedAt)}</span>
          </div>

          {selectedLabels.length > 0 ? (
            <div className="note-editor__selected-labels">
              {selectedLabels.map((label) => (
                <span key={label} className="note-chip">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={handleHide}>
            Dong
          </Button>
        </Modal.Footer>
      </Modal>

      {isCollaboratorsOpen ? (
        <NoteCollaboratorsModal
          open={isCollaboratorsOpen}
          onCancel={() => setIsCollaboratorsOpen(false)}
          onSave={(nextCollaborators) => {
            const normalizedState = normalizeSecurityState(false, '', nextCollaborators);
            setSharedWith(normalizedState.sharedWith);
            setIsLocked(normalizedState.isLocked);
            setLockPassword(normalizedState.lockPassword);
            setIsCollaboratorsOpen(false);
          }}
          collaborators={sharedWith}
          suggestions={collaboratorEmailSuggestions}
        />
      ) : null}

      <Modal
        show={isLockSetupOpen}
        onHide={handleCancelLockSetup}
        centered
        dialogClassName="note-lock-modal"
      >
        <Modal.Header className="border-0">
          <Modal.Title>{isLocked ? 'Quan ly khoa ghi chu' : 'Thiet lap khoa ghi chu'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Nhap mat khau"
            value={lockDraftPassword}
            onChange={(event) => {
              setLockDraftPassword(event.target.value);
              setLockSetupError('');
            }}
          />
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Nhap lai mat khau"
            value={lockDraftConfirm}
            onChange={(event) => {
              setLockDraftConfirm(event.target.value);
              setLockSetupError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSaveLockSetup();
              }
            }}
          />
          {lockSetupError ? <div className="note-editor__lock-error">{lockSetupError}</div> : null}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          {isLocked ? (
            <Button variant="outline-danger" onClick={handleRemoveLock}>
              Bo khoa
            </Button>
          ) : null}
          <Button variant="outline-secondary" onClick={handleCancelLockSetup}>
            Huy
          </Button>
          <Button variant="primary" onClick={handleSaveLockSetup}>
            Luu
          </Button>
        </Modal.Footer>
      </Modal>

      {open && !isCollaboratorsOpen && !isLockSetupOpen && activeImage ? (
        <div
          className="note-image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Xem anh dinh kem"
          onClick={handleCloseImageViewer}
        >
          <button
            type="button"
            className="note-image-viewer__close"
            onClick={(event) => {
              event.stopPropagation();
              handleCloseImageViewer();
            }}
            aria-label="Dong anh"
            title="Dong"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <div className="note-image-viewer__stage" onClick={(event) => event.stopPropagation()}>
            <img className="note-image-viewer__img" src={activeImage} alt="Anh dinh kem" />
          </div>
        </div>
      ) : null}

      <NoteDeleteConfirmDialog
        open={isDeleteConfirmOpen}
        noteTitle={note?.title || 'Untitled'}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default NoteEditorModal;
