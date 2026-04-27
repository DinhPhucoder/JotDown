import { useEffect, useState, useDeferredValue } from 'react';
import { Button, Modal, Offcanvas } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faStickyNote } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import NoteCard from '../features/notes/components/NoteCard';
import NoteEditorModal from '../features/notes/components/NoteEditorModal';
import NoteSettingsModal from '../features/notes/components/NoteSettingsModal';
import UserProfileModal from '../features/profile/components/UserProfileModal';
import NotesHeader from '../features/notes/components/NotesHeader';
import NotesSidebar from '../features/notes/components/NotesSidebar';
import { loadNoteWorkspace, saveNoteWorkspace } from '../data/noteWorkspace';
import { useTheme } from '../hooks/useTheme';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { resolveNoteShareMeta } from '../features/notes/utils/noteShareResolver';
import { sortNotes } from '../features/notes/utils/noteSorter';
import NoteGrid from '../components/common/NoteGrid';
import AnimatedNoteCard from '../components/common/AnimatedNoteCard';
import '../features/notes/styles/index.css';

function resolveNoteFontSize(value) {
  return value === 'small' || value === 'large' ? value : 'medium';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function NotesPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isOffline = useOnlineStatus();
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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    saveNoteWorkspace({ notes, labels, user, viewMode });
  }, [notes, labels, user, viewMode]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const normalizedUserEmail = normalizeEmail(user.email);

  const filteredNotes = sortNotes(
    notes
      .map((note) => ({
        ...note,
        __shareMeta: resolveNoteShareMeta(note, normalizedUserEmail),
      }))
      .filter((note) => {
      if (showShared && !note.__shareMeta.isOwnedShared && !note.__shareMeta.isReceivedShared) {
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
  const ownedSharedNotes = filteredNotes.filter((note) => note.__shareMeta?.isOwnedShared);
  const receivedSharedNotes = filteredNotes.filter((note) => note.__shareMeta?.isReceivedShared);
  const noteFontSize = resolveNoteFontSize(user?.preferences?.fontSize);

  function renderNote(note) {
    return (
      <AnimatedNoteCard
        key={note.id}
        note={note}
        viewMode={viewMode}
        onOpen={openEditor}
        onTogglePin={handleToggleNotePin}
        isOffline={isOffline}
        shareScope={
          note.__shareMeta?.isReceivedShared ? 'received'
          : note.__shareMeta?.isOwnedShared ? 'owned'
          : null
        }
        accessPermission={note.__shareMeta?.isReceivedShared ? note.__shareMeta.myPermission : null}
      />
    );
  }

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
      setUnlockError('Mật khẩu không đúng.');
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
        ? []
        : [labelName],
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

  function handleUpdateProfilePreferences(nextPreferences) {
    const nextDefaultColor = String(nextPreferences?.defaultNoteColor || '').trim();
    const shouldSyncAllNoteColors =
      nextDefaultColor.length > 0 && nextDefaultColor !== user?.preferences?.defaultNoteColor;

    setUser((currentUser) => ({
      ...currentUser,
      preferences: {
        ...currentUser.preferences,
        ...nextPreferences,
        fontSize: resolveNoteFontSize(nextPreferences?.fontSize),
      },
    }));

    if (!shouldSyncAllNoteColors) {
      return;
    }

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.color === nextDefaultColor
          ? note
          : {
              ...note,
              color: nextDefaultColor,
            },
      ),
    );
  }

  function handleOpenLogoutConfirm() {
    setLogoutConfirmOpen(true);
  }

  function handleCloseLogoutConfirm() {
    setLogoutConfirmOpen(false);
  }

  function handleConfirmLogout() {
    setLogoutConfirmOpen(false);
    navigate('/login');
  }

  return (
    <div className={`notes-shell note-font-${noteFontSize}`}>
      <NotesHeader
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        userName={user.displayName}
        isVerified={user.isVerified}
        selectedLabel={selectedLabels.length > 0 ? selectedLabels[0] : null}
        onLogout={handleOpenLogoutConfirm}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        onToggleDesktopSidebar={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
      />

      <div className="container-fluid notes-main">
        <div className="row g-4 flex-nowrap overflow-hidden">
          <aside className={`col-lg-3 col-xl-3 col-xxl-2 d-none d-lg-block notes-sidebar-aside ${!desktopSidebarOpen ? 'collapsed' : ''}`}>
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

          <div className="col flex-grow-1 notes-content-area">
            {filteredNotes.length > 0 ? (
              <>
                {showShared ? (
                  <>
                    <section className="notes-shared-space">
                      <div className="notes-shared-space__header">
                        <div className="notes-shared-space__title">Ghi chú của tôi</div>
                      </div>
                      <NoteGrid items={ownedSharedNotes} viewMode={viewMode} renderItem={renderNote} emptyMessage="Không có ghi chú trong khu vực này." />
                    </section>
                    <section className="notes-shared-space">
                      <div className="notes-shared-space__header">
                        <div className="notes-shared-space__title">Ghi chú được chia sẻ</div>
                      </div>
                      <NoteGrid items={receivedSharedNotes} viewMode={viewMode} renderItem={renderNote} emptyMessage="Không có ghi chú trong khu vực này." />
                    </section>
                  </>
                ) : (
                  <>
                    <NoteGrid items={pinnedNotes} viewMode={viewMode} title={pinnedNotes.length > 0 ? 'Đã ghim' : ''} renderItem={renderNote} />
                    <NoteGrid items={otherNotes} viewMode={viewMode} title={pinnedNotes.length > 0 ? 'Khác' : ''} renderItem={renderNote} />
                  </>
                )}
              </>
            ) : (
              <div className="notes-panel notes-empty-state">
                <div className="notes-empty-state__icon">
                  <FontAwesomeIcon icon={faStickyNote} />
                </div>
                <h2 className="h4">Chưa có ghi chú phù hợp</h2>
                <p className="text-secondary mb-4">
                  Thử xóa bộ lọc hiện tại hoặc tạo ghi chú mới để bắt đầu kho ghi chú của bạn.
                </p>
                <Button variant="primary" onClick={() => openEditor(null)}>
                  Tạo ghi chú đầu tiên
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button className="note-fab" onClick={() => openEditor(null)} aria-label="Tạo ghi chú mới">
        <FontAwesomeIcon icon={faPlus} />
      </Button>

      <Offcanvas
        show={mobileSidebarOpen}
        onHide={() => setMobileSidebarOpen(false)}
        placement="start"
        className="notes-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Bộ lọc ghi chú</Offcanvas.Title>
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
        preferences={user.preferences}
        onUpdatePreferences={handleUpdateProfilePreferences}
      />

      <Modal show={Boolean(unlockingNote)} onHide={handleCancelUnlock} centered dialogClassName="note-lock-modal">
        <Modal.Header className="border-0">
          <Modal.Title>Nhập mật khẩu để mở ghi chú</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Mật khẩu ghi chú"
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
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmUnlock}>
            Mở ghi chú
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={logoutConfirmOpen} onHide={handleCloseLogoutConfirm} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Xác nhận đăng xuất</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          Bạn có chắc muốn đăng xuất khỏi phiên làm việc hiện tại không?
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={handleCloseLogoutConfirm}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmLogout}>
            Đăng xuất
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default NotesPage;
