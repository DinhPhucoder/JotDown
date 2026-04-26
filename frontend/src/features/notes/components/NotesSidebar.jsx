import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faFolderOpen,
  faPencil,
  faPlus,
  faShareNodes,
  faTag,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

function SidebarButton({ active, icon, label, onClick, trailing }) {
  return (
    <div 
      className={`notes-sidebar-btn ${active ? 'active' : ''}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <span className="notes-sidebar-btn__icon">
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className="flex-grow-1 text-start text-truncate">{label}</span>
      {trailing}
    </div>
  );
}

function NotesSidebar({
  labels,
  selectedLabels,
  onToggleLabel,
  onAddLabel,
  onRenameLabel,
  onDeleteLabel,
  showShared,
  onToggleShared,
  onShowAll,
}) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  function handleAddLabel() {
    const trimmed = newLabel.trim();

    if (!trimmed) {
      return;
    }

    onAddLabel(trimmed);
    setNewLabel('');
  }

  function startEditing(label) {
    setEditingId(label.id);
    setEditingName(label.name);
  }

  function handleRename() {
    const trimmed = editingName.trim();

    if (!editingId || !trimmed) {
      return;
    }

    onRenameLabel(editingId, trimmed);
    setEditingId(null);
    setEditingName('');
  }

  return (
    <div className="notes-sidebar">
      <SidebarButton
        active={selectedLabels.length === 0 && !showShared}
        icon={faFolderOpen}
        label="Tất cả ghi chú"
        onClick={onShowAll}
      />
      <SidebarButton
        active={showShared}
        icon={faShareNodes}
        label="Ghi chú chia sẻ"
        onClick={onToggleShared}
      />

      <div className="notes-sidebar__section">
        <div className="notes-sidebar__heading">Nhãn</div>

        <div className="d-flex flex-column gap-2">
          {labels.map((label) =>
            editingId === label.id ? (
              <div key={label.id} className="notes-sidebar-edit">
                <input
                  type="text"
                  className="form-control"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleRename();
                    }
                  }}
                  autoFocus
                />
                <button type="button" className="notes-icon-btn" onClick={handleRename} aria-label="Lưu nhãn">
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              </div>
            ) : (
              <SidebarButton
                key={label.id}
                active={selectedLabels.includes(label.name)}
                icon={faTag}
                label={label.name}
                onClick={() => onToggleLabel(label.name)}
                trailing={
                  <span className="notes-sidebar-actions">
                    <button
                      type="button"
                      className="notes-sidebar-inline-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditing(label);
                      }}
                      aria-label={`Sửa nhãn ${label.name}`}
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </button>
                    <button
                      type="button"
                      className="notes-sidebar-inline-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteLabel(label.id);
                      }}
                      aria-label={`Xóa nhãn ${label.name}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </span>
                }
              />
            ),
          )}
        </div>

        <div className="notes-sidebar-create">
          <input
            type="text"
            className="form-control"
            placeholder="Nhãn mới..."
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleAddLabel();
              }
            }}
          />
          <button type="button" className="notes-icon-btn" onClick={handleAddLabel} aria-label="Thêm nhãn">
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotesSidebar;
