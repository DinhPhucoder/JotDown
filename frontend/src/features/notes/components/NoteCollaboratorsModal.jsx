import { useState, useEffect } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import {
  shareNoteOnServer,
  updateNoteShareOnServer,
  revokeNoteShareOnServer,
} from '../services/noteApiService';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAvatarText(nameOrEmail) {
  return String(nameOrEmail || '').trim().charAt(0).toUpperCase() || '?';
}

function getDisplayName(receiver) {
  return receiver?.name || receiver?.email?.split('@')[0] || 'Unknown';
}

/**
 * NoteCollaboratorsModal — API-connected version.
 *
 * Props:
 *   open        {boolean}
 *   onClose     {Function}  — đóng modal
 *   noteId      {string|number|null}  — null = note chưa lưu lên server
 *   ownerName   {string}
 *   ownerEmail  {string}
 *   initialCollaborators {Array}  — danh sách share đã có (từ local state)
 *   onCollaboratorsChange {Function}  — callback cập nhật local state cha
 */
function NoteCollaboratorsModal({
  open,
  onClose,
  noteId,
  ownerName = 'Bạn (Chủ sở hữu)',
  ownerEmail = '',
  ownerAvatar = null,
  initialCollaborators = [],
  onCollaboratorsChange,
}) {
  const isServerNote = noteId && /^\d+$/.test(String(noteId));

  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState(null); // shareId đang cập nhật
  const [revokingId, setRevokingId] = useState(null); // shareId đang thu hồi

  const normalizedQuery = query.trim().toLowerCase();
  const collaboratorEmails = collaborators.map((c) =>
    String(c.receiver?.email || c.email || '').toLowerCase()
  );
  const canAdd = isValidEmail(normalizedQuery) && !collaboratorEmails.includes(normalizedQuery);

  // Reset state mỗi lần mở modal
  useEffect(() => {
    if (open) {
      setCollaborators(initialCollaborators);
      setQuery('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    const email = normalizedQuery;
    if (!isValidEmail(email) || collaboratorEmails.includes(email)) return;

    if (!isServerNote) {
      // Note chưa được lưu lên server — thêm local, báo user
      const localEntry = { email, permission: 'read', sharedAt: new Date().toISOString() };
      const next = [...collaborators, localEntry];
      setCollaborators(next);
      onCollaboratorsChange?.(next);
      setQuery('');
      toast.success(`Đã thêm ${email} (sẽ chia sẻ khi lưu note)`);
      return;
    }

    setIsAdding(true);
    try {
      const share = await shareNoteOnServer(noteId, email, 'read');
      const normalized = share ?? { email, permission: 'READ', receiver: { email } };
      const next = [...collaborators, normalized];
      setCollaborators(next);
      onCollaboratorsChange?.(next);
      setQuery('');
      toast.success(`Đã chia sẻ với ${email}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handlePermissionChange(share, nextPermission) {
    const shareId = share?.id;
    const receiverEmail = share?.receiver?.email || share?.email;

    if (!shareId || !isServerNote) {
      // Cập nhật local
      const next = collaborators.map((c) =>
        (c.receiver?.email || c.email) === receiverEmail
          ? { ...c, permission: nextPermission }
          : c
      );
      setCollaborators(next);
      onCollaboratorsChange?.(next);
      return;
    }

    setUpdatingId(shareId);
    try {
      await updateNoteShareOnServer(noteId, shareId, nextPermission);
      const next = collaborators.map((c) =>
        c.id === shareId ? { ...c, permission: nextPermission.toUpperCase() } : c
      );
      setCollaborators(next);
      onCollaboratorsChange?.(next);
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật quyền.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRevoke(share) {
    const shareId = share?.id;
    const receiverEmail = share?.receiver?.email || share?.email;

    if (!shareId || !isServerNote) {
      // Xóa local
      const next = collaborators.filter(
        (c) => (c.receiver?.email || c.email) !== receiverEmail
      );
      setCollaborators(next);
      onCollaboratorsChange?.(next);
      return;
    }

    setRevokingId(shareId);
    try {
      await revokeNoteShareOnServer(noteId, shareId);
      const next = collaborators.filter((c) => c.id !== shareId);
      setCollaborators(next);
      onCollaboratorsChange?.(next);
      toast.success(`Đã thu hồi quyền của ${receiverEmail}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể thu hồi quyền.');
    } finally {
      setRevokingId(null);
    }
  }

  function normalizePermission(raw) {
    return String(raw || 'read').toLowerCase();
  }

  function getReceiverEmail(share) {
    return share?.receiver?.email || share?.email || '';
  }

  function getReceiverName(share) {
    return share?.receiver?.name || getDisplayName(share?.receiver) || getReceiverEmail(share);
  }

  return (
    <Modal show={open} onHide={onClose} centered dialogClassName="note-collaborators-modal">
      <Modal.Header className="border-0">
        <Modal.Title>Cộng tác viên</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-0">
        <div className="note-editor__collaborator-list">
          {/* Owner row */}
          <div className="note-editor__collaborator-item">
            <div className="note-editor__avatar">
              {ownerAvatar ? (
                <img 
                  src={ownerAvatar} 
                  alt={ownerName} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = getAvatarText(ownerEmail || ownerName);
                  }}
                />
              ) : (
                getAvatarText(ownerEmail || ownerName)
              )}
            </div>
            <div className="note-editor__collaborator-meta">
              <div className="note-editor__collaborator-name">{ownerName}</div>
              <div className="note-editor__collaborator-email">{ownerEmail}</div>
            </div>
            <div className="note-editor__permission-actions">
              <span className="note-editor__permission-badge">Chủ sở hữu</span>
            </div>
          </div>

          {/* Collaborator rows */}
          {collaborators.map((share, index) => {
            const email = getReceiverEmail(share);
            const name = getReceiverName(share);
            const permission = normalizePermission(share.permission);
            const shareId = share?.id;
            const isUpdating = shareId && updatingId === shareId;
            const isRevoking = shareId && revokingId === shareId;
            const key = shareId ?? `local-${index}`;

            return (
              <div key={key} className="note-editor__collaborator-item">
                <div className="note-editor__avatar">
                  {share.receiver?.avatar_url ? (
                    <img 
                      src={share.receiver.avatar_url} 
                      alt={name} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = getAvatarText(email);
                      }}
                    />
                  ) : (
                    getAvatarText(email)
                  )}
                </div>
                <div className="note-editor__collaborator-meta">
                  <div className="note-editor__collaborator-name">{name}</div>
                  <div className="note-editor__collaborator-email">{email}</div>
                  <div className="note-editor__permission-summary">
                    Quyền hiện tại: {permission === 'edit' ? 'Sửa' : 'Đọc'}
                  </div>
                </div>
                <div className="note-editor__permission-actions" role="group" aria-label="Quản lý quyền">
                  {isUpdating || isRevoking ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`note-editor__permission-btn ${permission === 'read' ? 'active' : ''}`}
                        onClick={() => handlePermissionChange(share, 'read')}
                        disabled={permission === 'read'}
                      >
                        Đọc
                      </button>
                      <button
                        type="button"
                        className={`note-editor__permission-btn ${permission === 'edit' ? 'active' : ''}`}
                        onClick={() => handlePermissionChange(share, 'edit')}
                        disabled={permission === 'edit'}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="note-editor__permission-btn note-editor__permission-btn--danger"
                        onClick={() => handleRevoke(share)}
                      >
                        Thu hồi
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add collaborator input */}
          <div className="note-editor__share-search">
            <div className="note-editor__avatar note-editor__avatar--muted">
              <FontAwesomeIcon icon={faUserPlus} />
            </div>
            <div className="note-editor__share-input-wrap">
              <input
                type="email"
                className="note-editor__share-input"
                placeholder="Nhập email để chia sẻ..."
                value={query}
                disabled={isAdding}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="notes-icon-btn"
              onClick={handleAdd}
              disabled={!canAdd || isAdding}
              title="Chia sẻ"
            >
              {isAdding ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faPlus} />}
            </button>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" onClick={onClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NoteCollaboratorsModal;
