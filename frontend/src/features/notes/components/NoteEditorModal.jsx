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
import TiptapEditor from './TiptapEditor';
import {
  deleteNoteAttachment,
  getAttachmentSignature,
  getNoteAttachmentSignature,
  saveNoteAttachment,
  uploadImageToCloudinary,
} from '../services/noteAttachmentService';
import { resolveNoteShareMeta } from '../utils/noteShareResolver';
import { removeOfflineAttachmentById, saveOfflineAttachment } from '../services/offlineAttachmentStore';
import { subscribeToNoteChannel } from '../../../services/noteRealtime';



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
  nextAttachments,
  nextLabels,
  nextSharedWith,
  nextLocked,
  nextLockPassword,
) {
  const normalizedState = normalizeSecurityState(nextLocked, nextLockPassword, nextSharedWith);
  const normalizedImages = (Array.isArray(nextImages) ? nextImages : [])
    .map((item) => String(item || ''))
    .filter(Boolean);
  const normalizedAttachments = (Array.isArray(nextAttachments) ? nextAttachments : [])
    .map((item) => ({
      id: String(item?.id ?? item?.local_file_id ?? ''),
      file_url: String(item?.file_url || ''),
      file_size: Number(item?.file_size || 0),
      file_type: String(item?.file_type || ''),
      is_local_only: Boolean(item?.is_local_only),
      sync_status: String(item?.sync_status || ''),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return JSON.stringify({
    title: nextTitle,
    content: nextContent,
    isPinned: nextPinned,
    images: normalizedImages,
    attachments: normalizedAttachments,
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
      id: entry?.id,
      email: String(entry.email || entry.receiver?.email || '').trim().toLowerCase(),
      permission: String(entry.permission || entry.accessPermission || '').toLowerCase() === 'edit' ? 'edit' : 'read',
      sharedAt: String(entry.sharedAt || entry.created_at || entry.createdAt || new Date().toISOString()),
      receiver: entry?.receiver,
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

function formatLastEditedText(value) {
  const parsedDate = value ? new Date(value) : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Đã chỉnh sửa lúc --:--';
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

  return `Đã chỉnh sửa lúc ${formattedValue}`;
}

function NoteEditorModal({
  note,
  open,
  defaultColor,
  currentUserEmail,
  isOffline = false,
  availableLabels = [],
  onClose,
  onDelete,
  onSave,
}) {
  const shareMeta = useMemo(() => {
    if (!note || !currentUserEmail) return null;
    return resolveNoteShareMeta(note, currentUserEmail);
  }, [note, currentUserEmail]);

  const isReadOnly = shareMeta ? (shareMeta.isReceivedShared && shareMeta.myPermission === 'read') : false;
  const canModifySecurity = !shareMeta || shareMeta.isOwnedByMe;

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imageMetas, setImageMetas] = useState(() => {
    if (!Array.isArray(note?.attachments)) {
      return [];
    }

    return note.attachments
      .filter(Boolean)
      .slice(0, 3)
      .map((attachment) => ({
        file_size: Number(attachment.file_size || 0),
      }));
  });
  const [attachmentItems, setAttachmentItems] = useState(() => {
    if (!Array.isArray(note?.attachments)) {
      return [];
    }

    return note.attachments.filter(Boolean).slice(0, 3);
  });

  const fileInputRef = useRef(null);
  const labelPanelRef = useRef(null);
  const noteIdRef = useRef(note?.id || null);
  const localPreviewUrlsRef = useRef(new Set());

  useEffect(() => {
    if (note?.id && note.id !== noteIdRef.current) {
      noteIdRef.current = note.id;
    }
  }, [note?.id]);

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
      note?.attachments || [],
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
    attachmentItems,
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
  const canManageCollaborators = canModifySecurity && !isLocked;
  const canManageLock = canModifySecurity && sharedWith.length === 0;

  function setSnapshotFromDraft(draft) {
    setSavedSnapshot(
      createDraftSnapshot(
        draft.title,
        draft.content,
        draft.isPinned,
        draft.images,
        draft.attachments,
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
        attachments: attachmentItems,
        sharedWith: normalizedState.sharedWith,
        createdAt: note?.createdAt || now,
        updatedAt: now,
      };
    },
    [
      title,
      content,
      note,
      defaultColor,
      isPinned,
      isLocked,
      lockPassword,
      selectedLabels,
      images,
      attachmentItems,
      sharedWith,
    ],
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
      setLockSetupError('Mật khẩu cần ít nhất 4 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setLockSetupError('Hai mật khẩu không khớp.');
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

  async function saveOfflineImageAttachments(nextFiles) {
    const localNoteId = String(note?.id || noteIdRef.current || crypto.randomUUID());
    noteIdRef.current = localNoteId;
    const localUrls = [];
    const localMetas = [];
    const localAttachments = [];

    for (const file of nextFiles) {
      const localAttachmentId = `local-${crypto.randomUUID()}`;
      const previewUrl = URL.createObjectURL(file);
      localPreviewUrlsRef.current.add(previewUrl);

      await saveOfflineAttachment({
        id: localAttachmentId,
        note_id: localNoteId,
        file,
        file_name: file.name,
        file_type: file.type,
        file_size: Number(file.size || 0),
        created_at: new Date().toISOString(),
      });

      localUrls.push(previewUrl);
      localMetas.push({ file_size: Number(file.size || 0) });
      localAttachments.push({
        id: localAttachmentId,
        local_file_id: localAttachmentId,
        file_url: previewUrl,
        file_size: Number(file.size || 0),
        file_type: file.type,
        original_name: file.name,
        is_local_only: true,
        sync_status: 'pending_upload',
      });
    }

    setImages((currentImages) => [...currentImages, ...localUrls].slice(0, 3));
    setImageMetas((currentMetas) => [...currentMetas, ...localMetas].slice(0, 3));
    setAttachmentItems((currentAttachments) => [...currentAttachments, ...localAttachments].slice(0, 3));
  }

  function isNetworkUploadFailure(error) {
    const message = String(error?.message || '');

    return (
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('Load failed')
    );
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

    const allowedTypes = new Set(['image/jpeg', 'image/png']);
    const nextFiles = files.slice(0, remainingImageSlots);
    const currentSize = imageMetas.reduce((total, item) => total + Number(item.file_size || 0), 0);
    const newSize = nextFiles.reduce((total, file) => total + Number(file.size || 0), 0);

    if (!nextFiles.every((file) => allowedTypes.has(file.type))) {
      setUploadError('Chỉ hỗ trợ ảnh JPG hoặc PNG.');
      event.target.value = '';
      return;
    }

    if (currentSize + newSize > 15 * 1024 * 1024) {
      setUploadError('Tổng dung lượng ảnh không được vượt quá 15MB.');
      event.target.value = '';
      return;
    }

    setUploadError('');
    setIsUploadingImage(true);

    try {
      if (isOffline) {
        await saveOfflineImageAttachments(nextFiles);
        return;
      }

      const uploadedUrls = [];
      const uploadedMetas = [];
      const uploadedAttachments = [];

      for (const file of nextFiles) {
        const noteId = Number(note?.id);
        const signaturePayload =
          noteId && !Number.isNaN(noteId)
            ? await getNoteAttachmentSignature(noteId)
            : await getAttachmentSignature();
        const cloudinaryResponse = await uploadImageToCloudinary(file, signaturePayload);

        if (noteId && !Number.isNaN(noteId)) {
          const savedAttachment = await saveNoteAttachment(noteId, {
            file_url: cloudinaryResponse.secure_url,
            file_size: cloudinaryResponse.bytes,
            file_type: cloudinaryResponse.format,
            original_name: cloudinaryResponse.original_filename,
          });

          uploadedUrls.push(savedAttachment.file_url);
          uploadedMetas.push({ file_size: savedAttachment.file_size });
          uploadedAttachments.push(savedAttachment);
        } else {
          uploadedUrls.push(cloudinaryResponse.secure_url);
          uploadedMetas.push({ file_size: cloudinaryResponse.bytes });
          uploadedAttachments.push({
            id: `pending-${crypto.randomUUID()}`,
            file_url: cloudinaryResponse.secure_url,
            file_size: cloudinaryResponse.bytes,
            file_type: cloudinaryResponse.format,
            original_name: cloudinaryResponse.original_filename,
            is_local_only: false,
            sync_status: 'pending_note_create',
          });
        }
      }

      setImages((currentImages) => [...currentImages, ...uploadedUrls].slice(0, 3));
      setImageMetas((currentMetas) => [...currentMetas, ...uploadedMetas].slice(0, 3));
      setAttachmentItems((currentAttachments) => [...currentAttachments, ...uploadedAttachments].slice(0, 3));
    } catch (error) {
      if (!isOffline && isNetworkUploadFailure(error)) {
        try {
          await saveOfflineImageAttachments(nextFiles);
          setUploadError('');
          return;
        } catch (offlineError) {
          setUploadError(offlineError?.message || 'Không thể tải ảnh lên.');
          return;
        }
      }

      setUploadError(error?.message || 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingImage(false);
    }

    event.target.value = '';
  }

  async function handleRemoveImage(index) {
    if (index < 0 || index >= images.length) {
      return;
    }

    const nextImages = images.filter((_, itemIndex) => itemIndex !== index);
    const nextMetas = imageMetas.filter((_, itemIndex) => itemIndex !== index);
    const attachmentToDelete = attachmentItems[index];
    const nextAttachments = attachmentItems.filter((_, itemIndex) => itemIndex !== index);

    setImages(nextImages);
    setImageMetas(nextMetas);
    setAttachmentItems(nextAttachments);

    if (attachmentToDelete?.is_local_only || attachmentToDelete?.local_file_id) {
      try {
        const localId = String(attachmentToDelete.local_file_id || attachmentToDelete.id || '');
        if (localId) {
          await removeOfflineAttachmentById(localId);
        }

        if (typeof attachmentToDelete?.file_url === 'string' && attachmentToDelete.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(attachmentToDelete.file_url);
          localPreviewUrlsRef.current.delete(attachmentToDelete.file_url);
        }
      } catch (error) {
        setImages(images);
        setImageMetas(imageMetas);
        setAttachmentItems(attachmentItems);
        setUploadError(error?.message || 'Không thể xóa ảnh offline ngay lúc này.');
      }
      return;
    }

    if (!attachmentToDelete?.id || !note?.id) {
      return;
    }

    try {
      await deleteNoteAttachment(note.id, attachmentToDelete.id);
    } catch (error) {
      setImages(images);
      setImageMetas(imageMetas);
      setAttachmentItems(attachmentItems);
      setUploadError(error?.message || 'Không thể xóa ảnh ngay lúc này.');
    }
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

  // Subscribe to realtime note updates
  useEffect(() => {
    if (!open || !note?.id || !(/^\d+$/.test(String(note.id)))) {
      return undefined;
    }

    let unsubscribe = () => {};

    subscribeToNoteChannel(note.id, (payload) => {
      console.log(`[NoteEditorModal] Received update for note ${note.id}:`, payload);
      if (!payload?.note) {
        console.log(`[NoteEditorModal] No payload.note found, skipping update`);
        return;
      }

      const updatedNote = payload.note;
      
      // Only update if it's from another user (not from current session)
      if (String(updatedNote.id) === String(note.id)) {
        // Update title and content
        setTitle(updatedNote.title || '');
        setContent(updatedNote.content || '');
        setLastEditedAt(updatedNote.updated_at || new Date().toISOString());
        
        // Update images/attachments if they changed
        if (Array.isArray(updatedNote.attachments)) {
          setAttachmentItems(updatedNote.attachments.filter(Boolean).slice(0, 3));
          setImageMetas(
            updatedNote.attachments
              .filter(Boolean)
              .slice(0, 3)
              .map((attachment) => ({
                file_size: Number(attachment.file_size || 0),
              }))
          );
        }

        // Update shared info
        if (Array.isArray(updatedNote.shares)) {
          const normalizedState = normalizeSecurityState(
            updatedNote.is_protected,
            '',
            updatedNote.shares
          );
          setSharedWith(normalizedState.sharedWith);
        }

        // Update locked state if changed
        if (updatedNote.is_protected !== note.isLocked) {
          setIsLocked(Boolean(updatedNote.is_protected));
        }
      }
    })
      .then((unsubscribeFn) => {
        unsubscribe = unsubscribeFn;
      })
      .catch(() => {
        // Realtime unavailable, that's ok
      });

    return () => {
      unsubscribe();
    };
  }, [open, note?.id]);

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
          <Modal.Title>{note ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới'}</Modal.Title>
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
                  aria-label="Mở ảnh đính kèm"
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
                    disabled={isOffline && !attachmentItems[index]?.is_local_only}
                    onClick={async (event) => {
                      event.stopPropagation();
                      await handleRemoveImage(index);
                    }}
                    aria-label="Xóa ảnh"
                    title="Xóa ảnh"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <input
            type="text"
            className={`note-editor__title ${isReadOnly ? 'note-editor__title--readonly' : ''}`}
            placeholder="Tiêu đề"
            value={title}
            readOnly={isReadOnly}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Nội dung ghi chú..."
            readOnly={isReadOnly}
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
                  title="Mời cộng tác viên"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                </button>
              ) : null}

              <button
                type="button"
                className={`notes-icon-btn ${selectedLabels.length > 0 ? 'active' : ''}`}
                onClick={() => setIsLabelPanelOpen((current) => !current)}
                title="Gắn nhãn"
              >
                <FontAwesomeIcon icon={faTag} />
              </button>

              <button
                type="button"
                className="notes-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReadOnly || remainingImageSlots <= 0 || isUploadingImage}
                title={
                  isOffline
                    ? `Thêm ảnh offline (${images.length}/3)`
                    : remainingImageSlots > 0
                    ? `Thêm ảnh (${images.length}/3)`
                    : 'Đã đạt tối đa 3 ảnh'
                }
              >
                <FontAwesomeIcon icon={faImage} />
              </button>

              {canManageLock ? (
                <button
                  type="button"
                  className={`notes-icon-btn ${isLocked ? 'active' : ''}`}
                  onClick={handleOpenLockSetup}
                  title={isLocked ? 'Quản lý khóa' : 'Thêm khóa'}
                >
                  <FontAwesomeIcon icon={faLock} />
                </button>
              ) : null}

              {note && canModifySecurity ? (
                <button type="button" className="notes-icon-btn notes-icon-btn--danger" onClick={handleDeleteClick}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              ) : null}

              {isLabelPanelOpen ? (
                <div ref={labelPanelRef} className="note-editor__floating-panel note-editor__floating-panel--labels">
                  <input
                    type="text"
                    className="note-editor__panel-input"
                    placeholder="Tìm nhãn..."
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
                          {selectedLabels.includes(label) ? <span>Đã chọn</span> : null}
                        </button>
                      ))
                    ) : (
                      <div className="note-editor__panel-empty">Không tìm thấy nhãn phù hợp.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <span className="note-editor__status">{formatLastEditedText(lastEditedAt)}</span>
          </div>

            {uploadError ? <div className="note-editor__lock-error mt-2">{uploadError}</div> : null}
            {isOffline ? <div className="note-editor__status mt-2">Đang offline: ảnh mới sẽ chờ đồng bộ.</div> : null}
            {isUploadingImage ? <div className="note-editor__status mt-2">Đang tải ảnh...</div> : null}

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
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {isCollaboratorsOpen ? (
        <NoteCollaboratorsModal
          open={isCollaboratorsOpen}
          onClose={() => setIsCollaboratorsOpen(false)}
          noteId={note?.id ?? null}
          ownerName={undefined}
          ownerEmail={undefined}
          initialCollaborators={sharedWith}
          onCollaboratorsChange={(nextCollaborators) => {
            const normalizedState = normalizeSecurityState(false, '', nextCollaborators);
            const now = new Date().toISOString();
            const nextDraft = {
              ...buildDraft(now),
              isLocked: normalizedState.isLocked,
              lockPassword: normalizedState.lockPassword,
              sharedWith: normalizedState.sharedWith,
              updatedAt: now,
            };
            setSharedWith(normalizedState.sharedWith);
            setIsLocked(normalizedState.isLocked);
            setLockPassword(normalizedState.lockPassword);
            onSave(nextDraft);
            setSnapshotFromDraft(nextDraft);
          }}
        />
      ) : null}

      <Modal
        show={isLockSetupOpen}
        onHide={handleCancelLockSetup}
        centered
        dialogClassName="note-lock-modal"
      >
        <Modal.Header className="border-0">
          <Modal.Title>{isLocked ? 'Quản lý khóa ghi chú' : 'Thiết lập khóa ghi chú'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Nhập mật khẩu"
            value={lockDraftPassword}
            onChange={(event) => {
              setLockDraftPassword(event.target.value);
              setLockSetupError('');
            }}
          />
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Nhập lại mật khẩu"
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
              Bỏ khóa
            </Button>
          ) : null}
          <Button variant="outline-secondary" onClick={handleCancelLockSetup}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveLockSetup}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>

      {open && !isCollaboratorsOpen && !isLockSetupOpen && activeImage ? (
        <div
          className="note-image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh đính kèm"
          onClick={handleCloseImageViewer}
        >
          <button
            type="button"
            className="note-image-viewer__close"
            onClick={(event) => {
              event.stopPropagation();
              handleCloseImageViewer();
            }}
            aria-label="Đóng ảnh"
            title="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <div className="note-image-viewer__stage" onClick={(event) => event.stopPropagation()}>
            <img className="note-image-viewer__img" src={activeImage} alt="Ảnh đính kèm" />
          </div>
        </div>
      ) : null}

      <NoteDeleteConfirmDialog
        open={isDeleteConfirmOpen}
        noteTitle={note?.title || 'Không tiêu đề'}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default NoteEditorModal;

