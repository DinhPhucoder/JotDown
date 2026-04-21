import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faImage,
  faLock,
  faShareNodes,
  faThumbtack,
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

function NoteCard({ note, viewMode, onOpen }) {
  return (
    <button
      type="button"
      className={`note-card ${colorClassNames[note.color] || colorClassNames.default} ${
        viewMode === 'list' ? 'note-card--list' : ''
      }`}
      onClick={() => onOpen(note)}
    >
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div className="flex-grow-1 min-w-0">
          <div className="note-card__title">{note.title || 'Khong co tieu de'}</div>
          <div className="note-card__content">{note.content}</div>
        </div>

        <div className="note-card__meta-icons">
          {note.isPinned ? <FontAwesomeIcon icon={faThumbtack} /> : null}
          {note.isLocked ? <FontAwesomeIcon icon={faLock} /> : null}
          {note.sharedWith.length > 0 ? <FontAwesomeIcon icon={faShareNodes} /> : null}
          {note.images.length > 0 ? <FontAwesomeIcon icon={faImage} /> : null}
        </div>
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

      <div className="note-card__footer">
        <span className="note-card__timestamp">
          <FontAwesomeIcon icon={faClock} />
          <span>{formatter.format(new Date(note.updatedAt))}</span>
        </span>
        {note.sharedWith.length > 0 ? <span>{note.sharedWith.length} chia se</span> : <span>{note.labels.length} nhan</span>}
      </div>
    </button>
  );
}

export default NoteCard;
