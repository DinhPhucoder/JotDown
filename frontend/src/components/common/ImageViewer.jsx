import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Fullscreen image lightbox overlay.
 * Dismissible via click-outside, close button, or Escape key (handled by parent useEffect).
 *
 * @param {{ src: string, onClose: Function }} props
 */
function ImageViewer({ src, onClose }) {
  if (!src) {
    return null;
  }

  return (
    <div
      className="note-image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh đính kèm"
      onClick={onClose}
    >
      <button
        type="button"
        className="note-image-viewer__close"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Đóng ảnh"
        title="Đóng"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <div className="note-image-viewer__stage" onClick={(event) => event.stopPropagation()}>
        <img className="note-image-viewer__img" src={src} alt="Ảnh đính kèm" />
      </div>
    </div>
  );
}

export default ImageViewer;
