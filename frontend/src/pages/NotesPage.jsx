import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Modal, Offcanvas } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faStickyNote } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import NoteCard from '../components/notes/NoteCard';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import NoteSettingsModal from '../components/notes/NoteSettingsModal';
import UserProfileModal from '../components/notes/UserProfileModal';
import NotesHeader from '../components/notes/NotesHeader';
import NotesSidebar from '../components/notes/NotesSidebar';
import { loadNoteWorkspace, saveNoteWorkspace } from '../data/noteWorkspace';
import './NotesPage.css';

function readStoredTheme() {
  const storedTheme = window.localStorage.getItem('theme');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return storedTheme || (prefersDark ? 'dark' : 'light');
}

function sortNotes(items) {
  return [...items].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return Number(right.isPinned) - Number(left.isPinned);
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function NotesPage() {
  const navigate = useNavigate();
  const [initialWorkspace] = useState(() => loadNoteWorkspace());
  const [notes, setNotes] = useState(() => sortNotes(initialWorkspace.notes));
  const [labels, setLabels] = useState(() => initialWorkspace.labels);
  const [user, setUser] = useState(() => initialWorkspace.user);
  const [viewMode, setViewMode] = useState(() => initialWorkspace.viewMode);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [showShared, setShowShared] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [unlockingNote, setUnlockingNote] = useState(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  // Khôi phục font size đã lưu khi app khởi động
  useEffect(() => {
    const savedFontSize = localStorage.getItem('app-font-size');
    if (savedFontSize) {
      document.documentElement.style.fontSize = savedFontSize + 'px';
    }
  }, []);

  useEffect(() => {
    saveNoteWorkspace({
      notes,
      labels,
      user,
      viewMode,
    });
  }, [notes, labels, user, viewMode]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredNotes = sortNotes(
    notes.filter((note) => {
      if (showShared && note.sharedWith.length === 0) {
        return false;
      }

      if (selectedLabels.length > 0 && !selectedLabels.some((label) => note.labels.includes(label))) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return `${note.title} ${note.content}`.toLowerCase().includes(normalizedSearch);
    }),
  );

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned);
  const otherNotes = filteredNotes.filter((note) => !note.isPinned);
  const sharedCount = notes.filter((note) => note.sharedWith.length > 0).length;
  const noteCount = notes.length;
  const lastUpdated = notes[0] ? new Date(notes[0].updatedAt).toLocaleDateString('vi-VN') : 'Chua co';

  function openEditor(note = null) {
    const requiredPassword = String(note?.lockPassword || '').trim();

    if (note?.isLocked && requiredPassword.length > 0) {
      setUnlockingNote(note);
      setUnlockPassword('');
      setUnlockError('');
      return;
    }

    setEditingNote(note);
    setEditorOpen(true);
  }

  function handleCancelUnlock() {
    setUnlockingNote(null);
    setUnlockPassword('');
    setUnlockError('');
  }

  function handleConfirmUnlock() {
    if (!unlockingNote) {
      return;
    }

    const expectedPassword = String(unlockingNote.lockPassword || '').trim();

    if (expectedPassword.length > 0 && unlockPassword.trim() !== expectedPassword) {
      setUnlockError('Mat khau khong dung.');
      return;
    }

    setEditingNote(unlockingNote);
    setEditorOpen(true);
    handleCancelUnlock();
  }

  function handleSave(nextNote) {
    setNotes((currentNotes) => {
      const index = currentNotes.findIndex((item) => item.id === nextNote.id);

      if (index === -1) {
        return sortNotes([nextNote, ...currentNotes]);
      }

      const nextNotes = [...currentNotes];
      nextNotes[index] = nextNote;
      return sortNotes(nextNotes);
    });
  }

  function handleDelete(noteId) {
    setNotes((currentNotes) => currentNotes.filter((item) => item.id !== noteId));
    setEditingNote(null);
    setEditorOpen(false);
  }

  function handleToggleNotePin(noteId) {
    setNotes((currentNotes) =>
      sortNotes(
        currentNotes.map((note) =>
          note.id === noteId
            ? {
              ...note,
              isPinned: !note.isPinned,
              pinnedAt: !note.isPinned ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
            : note,
        ),
      ),
    );
  }

  function handleToggleLabel(labelName) {
    setSelectedLabels((currentLabels) =>
      currentLabels.includes(labelName)
        ? currentLabels.filter((item) => item !== labelName)
        : [...currentLabels, labelName],
    );
    setShowShared(false);
  }

  function handleAddLabel(labelName) {
    setLabels((currentLabels) => {
      const normalizedName = labelName.trim().toLowerCase();

      if (currentLabels.some((label) => label.name.trim().toLowerCase() === normalizedName)) {
        return currentLabels;
      }

      return [...currentLabels, { id: crypto.randomUUID(), name: labelName.trim() }];
    });
  }

  function handleRenameLabel(labelId, nextName) {
    const currentLabel = labels.find((label) => label.id === labelId);

    if (!currentLabel) {
      return;
    }

    setLabels((currentLabels) =>
      currentLabels.map((label) => (label.id === labelId ? { ...label, name: nextName } : label)),
    );
    setSelectedLabels((currentLabels) =>
      currentLabels.map((labelName) => (labelName === currentLabel.name ? nextName : labelName)),
    );
    setNotes((currentNotes) =>
      currentNotes.map((note) => ({
        ...note,
        labels: note.labels.map((labelName) => (labelName === currentLabel.name ? nextName : labelName)),
      })),
    );
  }

  function handleDeleteLabel(labelId) {
    const label = labels.find((item) => item.id === labelId);

    setLabels((currentLabels) => currentLabels.filter((item) => item.id !== labelId));

    if (!label) {
      return;
    }

    setSelectedLabels((currentLabels) => currentLabels.filter((item) => item !== label.name));
    setNotes((currentNotes) =>
      currentNotes.map((note) => ({
        ...note,
        labels: note.labels.filter((item) => item !== label.name),
      })),
    );
  }

  function renderNoteSection(title, items) {
    if (items.length === 0) {
      return null;
    }

    return (
      <section className="mb-4">
        {title ? <div className="notes-section-title">{title}</div> : null}
        <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
          {items.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              viewMode={viewMode}
              onOpen={openEditor}
              onTogglePin={handleToggleNotePin}
              isOffline={isOffline}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={`notes-shell note-font-${user.preferences.fontSize}`}>
      <NotesHeader
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        userName={user.displayName}
        isVerified={user.isVerified}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
        onLogout={() => navigate('/login')}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      <div className="container-fluid notes-main">
        <div className="row g-4">
          <aside className="col-lg-3 col-xl-3 col-xxl-2 d-none d-lg-block">
            <div className="notes-panel position-sticky top-0">
              <NotesSidebar
                labels={labels}
                selectedLabels={selectedLabels}
                onToggleLabel={handleToggleLabel}
                onAddLabel={handleAddLabel}
                onRenameLabel={handleRenameLabel}
                onDeleteLabel={handleDeleteLabel}
                showShared={showShared}
                onToggleShared={() => {
                  setShowShared((currentValue) => !currentValue);
                  setSelectedLabels([]);
                }}
                onShowAll={() => {
                  setSelectedLabels([]);
                  setShowShared(false);
                }}
              />
            </div>
          </aside>

          <div className="col-lg-9 col-xl-9 col-xxl-10">
            <div className="notes-summary-grid">
              <div className="notes-summary-card">
                <div className="notes-summary-card__label">Tong ghi chu</div>
                <div className="notes-summary-card__value">{noteCount}</div>
              </div>
              <div className="notes-summary-card">
                <div className="notes-summary-card__label">Dang hien thi</div>
                <div className="notes-summary-card__value">{filteredNotes.length}</div>
              </div>
              <div className="notes-summary-card">
                <div className="notes-summary-card__label">Ghi chu chia se</div>
                <div className="notes-summary-card__value">{sharedCount}</div>
              </div>
            </div>

            {filteredNotes.length > 0 ? (
              <>
                {renderNoteSection(pinnedNotes.length > 0 ? 'Da ghim' : '', pinnedNotes)}
                {renderNoteSection(pinnedNotes.length > 0 ? 'Khac' : '', otherNotes)}
              </>
            ) : (
              <div className="notes-panel notes-empty-state">
                <div className="notes-empty-state__icon">
                  <FontAwesomeIcon icon={faStickyNote} />
                </div>
                <h2 className="h4">Chua co ghi chu phu hop</h2>
                <p className="text-secondary mb-4">
                  Thu xoa bo loc hien tai hoac tao ghi chu moi de bat dau kho ghi chu cua ban.
                </p>
                <Button variant="primary" onClick={() => openEditor(null)}>
                  Tao ghi chu dau tien
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button className="note-fab" onClick={() => openEditor(null)} aria-label="Tao ghi chu moi">
        <FontAwesomeIcon icon={faPlus} />
      </Button>

      <Offcanvas
        show={mobileSidebarOpen}
        onHide={() => setMobileSidebarOpen(false)}
        placement="start"
        className="notes-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Bo loc ghi chu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <NotesSidebar
            labels={labels}
            selectedLabels={selectedLabels}
            onToggleLabel={(labelName) => {
              handleToggleLabel(labelName);
              setMobileSidebarOpen(false);
            }}
            onAddLabel={handleAddLabel}
            onRenameLabel={handleRenameLabel}
            onDeleteLabel={handleDeleteLabel}
            showShared={showShared}
            onToggleShared={() => {
              setShowShared((currentValue) => !currentValue);
              setSelectedLabels([]);
              setMobileSidebarOpen(false);
            }}
            onShowAll={() => {
              setSelectedLabels([]);
              setShowShared(false);
              setMobileSidebarOpen(false);
            }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {editorOpen ? (
        <NoteEditorModal
          key={`${editingNote?.id || 'new'}-${user.preferences.defaultNoteColor}`}
          note={editingNote}
          open={editorOpen}
          defaultColor={user.preferences.defaultNoteColor}
          availableLabels={labels.map((label) => label.name)}
          onClose={() => setEditorOpen(false)}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      ) : null}

      <NoteSettingsModal
        open={settingsOpen}
        preferences={user.preferences}
        onClose={() => setSettingsOpen(false)}
        onUpdate={(nextPreferences) =>
          setUser((currentUser) => ({
            ...currentUser,
            preferences: nextPreferences,
          }))
        }
      />

      <UserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        theme={theme}
        onToggleTheme={setTheme}
      />

      <Modal show={Boolean(unlockingNote)} onHide={handleCancelUnlock} centered dialogClassName="note-lock-modal">
        <Modal.Header className="border-0">
          <Modal.Title>Nhap mat khau de mo ghi chu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Mat khau ghi chu"
            value={unlockPassword}
            onChange={(event) => {
              setUnlockPassword(event.target.value);
              setUnlockError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleConfirmUnlock();
              }
            }}
          />
          {unlockError ? <div className="note-editor__lock-error">{unlockError}</div> : null}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={handleCancelUnlock}>
            Huy
          </Button>
          <Button variant="primary" onClick={handleConfirmUnlock}>
            Mo ghi chu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default NotesPage;
