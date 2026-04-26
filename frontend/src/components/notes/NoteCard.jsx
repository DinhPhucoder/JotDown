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

function getCollaboratorEmail(entry) {
  if (!entry) {
    return '';
  }

  if (typeof entry === 'string') {
    return entry.trim().toLowerCase();
  }

  return String(entry.email || '')
    .trim()
    .toLowerCase();
}

function getAvatarInitial(email) {
  const localPart = email.split('@')[0] || '';
  return (localPart.charAt(0) || '?').toUpperCase();
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
  const collaboratorEmails = (Array.isArray(note.sharedWith) ? note.sharedWith : [])
    .map(getCollaboratorEmail)
    .filter(Boolean);
  const displayedCollaborators = collaboratorEmails.slice(0, 5);
  const hiddenCollaboratorCount = Math.max(collaboratorEmails.length - displayedCollaborators.length, 0);
  const hasBadges = note.isLocked || collaboratorEmails.length > 0 || showPermissionBadge || isOffline;

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
                <span>Khoa</span> 
              </span>
            ) : null}
            {collaboratorEmails.length > 0 ? (
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
                <span>{normalizedPermission === 'edit' ? 'Quyen Sua' : 'Quyen Doc'}</span>
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

        <div className="note-card__title">{note.title || 'Khong co tieu de'}</div>
      </div>

      <div className={`note-card__content ${note.isLocked ? 'note-card__content--locked' : ''}`}>
        {note.content}
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

      {collaboratorEmails.length > 0 ? (
        <div className={`note-card__collaborators ${note.labels.length === 0 ? 'note-card__collaborators--top' : ''}`}>
          {displayedCollaborators.map((email) => (
            <span key={email} className="note-card__avatar" title={email} aria-label={email}>
              {getAvatarInitial(email)}
            </span>
          ))}
          {hiddenCollaboratorCount > 0 ? (
            <span
              className="note-card__avatar note-card__avatar--more"
              title={`${hiddenCollaboratorCount} cong tac vien khac`}
              aria-label={`${hiddenCollaboratorCount} cong tac vien khac`}
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

      <button
        type="button"
        className={`note-card__pin-corner ${note.isPinned ? 'active' : ''}`}
        onClick={handleTogglePin}
        title={note.isPinned ? 'Bo ghim' : 'Ghim ghi chu'}
        aria-label={note.isPinned ? 'Bo ghim' : 'Ghim ghi chu'}
      >
        <FontAwesomeIcon icon={faThumbtack} />
      </button>
    </div> 
  ); 
} 

export default NoteCard;
