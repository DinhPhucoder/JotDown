import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUserPlus } from '@fortawesome/free-solid-svg-icons';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAvatarText(email) {
  return email.trim().charAt(0).toUpperCase() || '?';
}

function getDisplayName(email) {
  const [name] = email.split('@');
  return name || email;
}

function NoteCollaboratorsModal({
  open,
  onCancel,
  onSave,
  ownerName = 'Ban (Chu so huu)',
  ownerEmail = 'user@example.com',
  collaborators,
  suggestions,
}) {
  const [query, setQuery] = useState('');
  const [draftCollaborators, setDraftCollaborators] = useState(() => collaborators);
  const normalizedQuery = query.trim().toLowerCase();
  const collaboratorEmails = draftCollaborators.map((entry) => entry.email.toLowerCase());

  const canAdd =
    isValidEmail(normalizedQuery) && !collaboratorEmails.includes(normalizedQuery);

  const filteredSuggestions = normalizedQuery
    ? suggestions
        .filter((email) => email.toLowerCase().includes(normalizedQuery))
        .filter((email) => !collaboratorEmails.includes(email.toLowerCase()))
        .slice(0, 5)
    : [];

  function handleAdd(rawEmail = query) {
    const nextEmail = rawEmail.trim().toLowerCase();

    if (!isValidEmail(nextEmail) || collaboratorEmails.includes(nextEmail)) {
      return;
    }

    const nextCollaborator = {
      email: nextEmail,
      permission: 'read',
      sharedAt: new Date().toISOString(),
    };

    setDraftCollaborators((currentEntries) => [...currentEntries, nextCollaborator]);
    setQuery('');
  }

  function handleRemove(email) {
    setDraftCollaborators((currentEntries) =>
      currentEntries.filter((entry) => entry.email !== email),
    );
  }

  function handlePermissionChange(email, permission) {
    if (permission !== 'read' && permission !== 'edit') {
      return;
    }

    setDraftCollaborators((currentEntries) =>
      currentEntries.map((entry) =>
        entry.email === email
          ? {
              ...entry,
              permission,
            }
          : entry,
      ),
    );
  }

  function handleSave() {
    onSave(draftCollaborators);
  }

  function handleCancel() {
    setDraftCollaborators(collaborators);
    setQuery('');
    onCancel();
  }

  return (
    <Modal show={open} onHide={handleCancel} centered dialogClassName="note-collaborators-modal">
      <Modal.Header className="border-0">
        <Modal.Title>Cong tac vien</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-0">
        <div className="note-editor__collaborator-list">
          <div className="note-editor__collaborator-item">
            <div className="note-editor__avatar">{getAvatarText(ownerEmail)}</div>
            <div className="note-editor__collaborator-meta">
              <div className="note-editor__collaborator-name">{ownerName}</div>
              <div className="note-editor__collaborator-email">{ownerEmail}</div>
            </div>
          </div>

          {draftCollaborators.map((entry) => (
            <div key={entry.email} className="note-editor__collaborator-item">
              <div className="note-editor__avatar">{getAvatarText(entry.email)}</div>
              <div className="note-editor__collaborator-meta">
                <div className="note-editor__collaborator-name">{getDisplayName(entry.email)}</div>
                <div className="note-editor__collaborator-email">{entry.email}</div>
                <div className="note-editor__permission-summary">
                  Quyen hien tai: {entry.permission === 'edit' ? 'Sua' : 'Doc'}
                </div>
              </div>
              <div className="note-editor__permission-actions" role="group" aria-label="Quan ly quyen">
                <button
                  type="button"
                  className={`note-editor__permission-btn ${
                    entry.permission === 'read' ? 'active' : ''
                  }`}
                  onClick={() => handlePermissionChange(entry.email, 'read')}
                >
                  Doc
                </button>
                <button
                  type="button"
                  className={`note-editor__permission-btn ${
                    entry.permission === 'edit' ? 'active' : ''
                  }`}
                  onClick={() => handlePermissionChange(entry.email, 'edit')}
                >
                  Sua
                </button>
                <button
                  type="button"
                  className="note-editor__permission-btn note-editor__permission-btn--danger"
                  onClick={() => handleRemove(entry.email)}
                >
                  Thu hoi
                </button>
              </div>
            </div>
          ))}

          <div className="note-editor__share-search">
            <div className="note-editor__avatar note-editor__avatar--muted">
              <FontAwesomeIcon icon={faUserPlus} />
            </div>
            <div className="note-editor__share-input-wrap">
              <input
                type="email"
                className="note-editor__share-input"
                placeholder="Nguoi hoac email se chia se"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
              />
              {filteredSuggestions.length > 0 ? (
                <div className="note-editor__share-suggestions">
                  {filteredSuggestions.map((email) => (
                    <button
                      key={email}
                      type="button"
                      className="note-editor__share-suggestion"
                      onClick={() => handleAdd(email)}
                    >
                      {email}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="notes-icon-btn"
              onClick={() => handleAdd()}
              disabled={!canAdd}
              title="Them nguoi chia se"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" onClick={handleCancel}>
          Huy
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Luu
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NoteCollaboratorsModal;
