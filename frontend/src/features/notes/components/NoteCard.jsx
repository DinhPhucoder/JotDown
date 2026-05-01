import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faEye,
  faLock,
  faPenToSquare,
  faShareNodes,
  faThumbtack,
  faWifi,
} from '@fortawesome/free-solid-svg-icons';

const colorClassNames = {
  default: 'note-card--default',
  yellow: 'note-card--yellow',
  green: 'note-card--green',
  blue: 'note-card--blue',
  pink: 'note-card--pink',
  purple: 'note-card--purple',
  orange: 'note-card--orange',
  teal: 'note-card--teal',
};

const formatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function getCollaboratorMeta(entry) {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return {
      email: entry.trim().toLowerCase(),
      avatar: null,
    };
  }

  const receiver = entry.receiver || entry;
  const email = String(receiver.email || '').trim().toLowerCase();
  const avatar = receiver.avatar_url || receiver.avatar || null;

  return email ? { email, avatar } : null;
}

function getAvatarInitial(email) {
  const localPart = email.split('@')[0] || '';
  return (localPart.charAt(0) || '?').toUpperCase();
}

function stripHtml(html) {
  if (!html) return '';
  let text = String(html).replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.body.textContent.trim() || '';
}

function NoteCard({
  note,
  viewMode,
  onOpen,
  onTogglePin,
  isOffline = false,
  shareScope = null,
  accessPermission = null,
}) {
  const previewImages = note.images.slice(0, 3);
  const hiddenImageCount = Math.max(note.images.length - 3, 0);
  const normalizedPermission = accessPermission === 'edit' ? 'edit' : 'read';
  const showPermissionBadge = shareScope === 'received';
  const collaborators = (Array.isArray(note.sharedWith) ? note.sharedWith : [])
    .map(getCollaboratorMeta)
    .filter(Boolean);

  // Xây dựng danh sách hiển thị cuối cùng
  let finalCollaborators = [...collaborators];
  
  // Nếu là người nhận (Recipient), hiển thị thêm Owner ở đầu danh sách
  if (shareScope === 'received' && note.ownerEmail) {
    const ownerMeta = {
      email: note.ownerEmail,
      avatar: note.ownerAvatar,
      isOwner: true
    };
    // Tránh trùng lặp
    if (!finalCollaborators.some(c => c.email === ownerMeta.email)) {
      finalCollaborators.unshift(ownerMeta);
    }
  }

  const displayedCollaborators = finalCollaborators.slice(0, 5);
  const hiddenCollaboratorCount = Math.max(finalCollaborators.length - displayedCollaborators.length, 0);
  const hasBadges = note.isLocked || finalCollaborators.length > 0 || showPermissionBadge || isOffline;
  const canEdit = !shareScope || shareScope === 'owned' || normalizedPermission === 'edit';

  function handleCardKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(note);
    }
  }

  function handleTogglePin(event) {
    event.stopPropagation();

    if (typeof onTogglePin === 'function') {
      onTogglePin(note.id);
    }
  }

  return ( 
    <div 
      className={`note-card ${colorClassNames[note.color] || colorClassNames.default} ${ 
        viewMode === 'list' ? 'note-card--list' : '' 
      }`} 
      onClick={() => onOpen(note)} 
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      role="button"
    > 
      {previewImages.length > 0 ? (
        <div
          className={`note-card__media note-card__media--${previewImages.length} ${
            note.isLocked ? 'note-card__media--locked' : ''
          }`}
        >
          {previewImages.map((image, index) => (
            <div key={`${note.id}-image-${index}`} className="note-card__media-item">
              <img src={image} alt={`note-${note.id}-image-${index + 1}`} loading="lazy" />
              {index === previewImages.length - 1 && hiddenImageCount > 0 ? (
                <div className="note-card__image-more">+{hiddenImageCount}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="note-card__header">
        {hasBadges ? (
          <div className="note-card__meta-badges">
            {note.isLocked ? ( 
              <span className="note-meta-badge note-meta-badge--locked"> 
                <FontAwesomeIcon icon={faLock} /> 
                <span>Khóa</span> 
              </span>
            ) : null}
            {collaborators.length > 0 ? (
              <span className="note-meta-badge note-meta-badge--shared">
                <FontAwesomeIcon icon={faShareNodes} />
                <span>Chia sẻ</span>
              </span>
            ) : null}
            {showPermissionBadge ? (
              <span
                className={`note-meta-badge note-meta-badge--permission note-meta-badge--permission-${normalizedPermission}`}
              >
                <FontAwesomeIcon icon={normalizedPermission === 'edit' ? faPenToSquare : faEye} />
                <span>{normalizedPermission === 'edit' ? 'Quyền sửa' : 'Quyền đọc'}</span>
              </span>
            ) : null}
            {isOffline ? (
              <span className="note-meta-badge note-meta-badge--offline">
                <FontAwesomeIcon icon={faWifi} />
                <span>Offline</span>
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="note-card__title">{note.title || 'Không có tiêu đề'}</div>
      </div>

      <div className={`note-card__content ${note.isLocked ? 'note-card__content--locked' : ''}`}>
        {stripHtml(note.content)}
      </div>

      {note.labels.length > 0 ? (
        <div className="note-card__chips">
          {note.labels.map((label) => (
            <span key={label} className="note-chip">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {finalCollaborators.length > 0 ? (
        <div className={`note-card__collaborators ${note.labels.length === 0 ? 'note-card__collaborators--top' : ''}`}>
          {displayedCollaborators.map((c) => (
            <span 
              key={c.email} 
              className="note-card__avatar" 
              title={c.isOwner ? `${c.email} (Chủ sở hữu)` : c.email} 
              aria-label={c.isOwner ? `${c.email} (Chủ sở hữu)` : c.email}
            >
              {c.avatar ? (
                <img 
                  src={c.avatar} 
                  alt={c.email} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = getAvatarInitial(c.email);
                  }}
                />
              ) : (
                getAvatarInitial(c.email)
              )}
            </span>
          ))}
          {hiddenCollaboratorCount > 0 ? (
            <span
              className="note-card__avatar note-card__avatar--more"
              title={`${hiddenCollaboratorCount} cộng tác viên khác`}
              aria-label={`${hiddenCollaboratorCount} cộng tác viên khác`}
            >
              +{hiddenCollaboratorCount}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="note-card__footer"> 
        <span className="note-card__timestamp"> 
          <FontAwesomeIcon icon={faClock} /> 
          <span>{formatter.format(new Date(note.updatedAt))}</span> 
        </span> 
      </div> 

      {canEdit ? (
        <button
          type="button"
          className={`note-card__pin-corner ${note.isPinned ? 'active' : ''}`}
          onClick={handleTogglePin}
          title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
          aria-label={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
        >
          <FontAwesomeIcon icon={faThumbtack} />
        </button>
      ) : null}
    </div> 
  ); 
} 

export default NoteCard;
