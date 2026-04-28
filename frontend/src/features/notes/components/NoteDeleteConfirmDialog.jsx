import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';
import './NoteDeleteConfirmDialog.css';

function NoteDeleteConfirmDialog({
  open = false,
  noteTitle = 'Untitled',
  onConfirm,
  onCancel,
  isDeleting = false,
}) {
  const handleConfirmClick = () => {
    if (typeof onConfirm === 'function' && !isDeleting) {
      onConfirm();
    }
  };

  const handleCancelClick = () => {
    if (typeof onCancel === 'function' && !isDeleting) {
      onCancel();
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isDeleting) {
      handleCancelClick();
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="note-delete-confirm-backdrop" onClick={handleBackdropClick}>
      <div className="note-delete-confirm-dialog">
        <div className="note-delete-confirm-icon">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>

        <div className="note-delete-confirm-content">
          <h2 className="note-delete-confirm-title">Xóa ghi chú?</h2>
          <p className="note-delete-confirm-message">
            Bạn sắp xóa ghi chú "<strong>{noteTitle}</strong>". Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="note-delete-confirm-actions">
          <button
            type="button"
            className="note-delete-confirm-btn note-delete-confirm-btn--cancel"
            onClick={handleCancelClick}
            disabled={isDeleting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="note-delete-confirm-btn note-delete-confirm-btn--delete"
            onClick={handleConfirmClick}
            disabled={isDeleting}
          >
            
            <span>{isDeleting ? 'Đang xóa...' : 'Xóa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteDeleteConfirmDialog;
