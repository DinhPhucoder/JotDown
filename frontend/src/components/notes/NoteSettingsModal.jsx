import { Button, Form, Modal } from 'react-bootstrap';
import { fontSizeOptions, noteColorOptions } from '../../data/noteWorkspace';

function NoteSettingsModal({ open, preferences, onClose, onUpdate }) {
  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>Cài đặt ghi chú</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        <div className="notes-settings-group">
          <Form.Label>Cỡ chữ mặc định</Form.Label>
          <Form.Select
            value={preferences.fontSize}
            onChange={(event) => onUpdate({ ...preferences, fontSize: event.target.value })}
          >
            {fontSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </div>

        <div className="notes-settings-group">
          <Form.Label>Màu ghi chú mặc định</Form.Label>
          <div className="notes-settings-swatches">
            {noteColorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`note-swatch ${preferences.defaultNoteColor === option.value ? 'active' : ''}`}
                style={{ background: option.swatch }}
                onClick={() => onUpdate({ ...preferences, defaultNoteColor: option.value })}
                title={option.label}
                aria-label={option.label}
              />
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="primary" onClick={onClose}>
          Xong
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NoteSettingsModal;
