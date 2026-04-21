import { useState, useMemo, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { Note, ViewMode, Label as LabelType } from "@/types/note";
import { mockNotes, mockLabels, mockUser } from "@/data/mockData";
import { Header } from "@/components/notes/Header";
import { LabelSidebar } from "@/components/notes/LabelSidebar";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { SettingsDialog } from "@/components/notes/SettingsDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoteKeep — Quản lý ghi chú thông minh" },
      {
        name: "description",
        content:
          "Tổ chức ghi chú với nhãn, ghim, chia sẻ và đồng bộ. Giao diện tối giản, hiệu quả.",
      },
      { property: "og:title", content: "NoteKeep — Quản lý ghi chú thông minh" },
      {
        property: "og:description",
        content: "Ứng dụng ghi chú premium với glassmorphism và gradient brand.",
      },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [labels, setLabels] = useState<LabelType[]>(mockLabels);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showShared, setShowShared] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState(mockUser);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (showShared) result = result.filter((n) => n.sharedWith.length > 0);
    if (selectedLabels.length > 0)
      result = result.filter((n) => selectedLabels.some((l) => n.labels.includes(l)));
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
      );
    }
    return result;
  }, [notes, debouncedSearch, selectedLabels, showShared]);

  const pinnedNotes = useMemo(
    () =>
      filteredNotes
        .filter((n) => n.isPinned)
        .sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || "")),
    [filteredNotes],
  );
  const otherNotes = useMemo(
    () =>
      filteredNotes
        .filter((n) => !n.isPinned)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [filteredNotes],
  );

  const handleSave = useCallback((note: Note) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      return idx >= 0 ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev];
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const openEditor = (note: Note | null) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
    setShowShared(false);
  };

  const addLabel = (name: string) =>
    setLabels((prev) => [...prev, { id: crypto.randomUUID(), name }]);

  const renameLabel = (id: string, name: string) => {
    const old = labels.find((l) => l.id === id)?.name;
    setLabels((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
    if (old)
      setNotes((prev) =>
        prev.map((n) => ({
          ...n,
          labels: n.labels.map((l) => (l === old ? name : l)),
        })),
      );
  };

  const deleteLabel = (id: string) => setLabels((prev) => prev.filter((l) => l.id !== id));

  const sidebar = (
    <LabelSidebar
      labels={labels}
      selectedLabels={selectedLabels}
      onToggleLabel={toggleLabel}
      onAddLabel={addLabel}
      onRenameLabel={renameLabel}
      onDeleteLabel={deleteLabel}
      showShared={showShared}
      onToggleShared={() => {
        setShowShared(!showShared);
        setSelectedLabels([]);
      }}
      onShowAll={() => {
        setSelectedLabels([]);
        setShowShared(false);
      }}
    />
  );

  const renderGroup = (items: Note[], title?: string) =>
    items.length > 0 ? (
      <section className="mb-8">
        {title && (
          <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
        )}
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-2",
          )}
        >
          {items.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              viewMode={viewMode}
              onClick={() => openEditor(note)}
            />
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className="min-h-screen">
      <Header
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        userName={user.displayName}
        isVerified={user.isVerified}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLogout={() => navigate({ to: "/login" })}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebar(true)}
      />

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] flex-shrink-0 overflow-y-auto p-4 lg:block">
          <div className="glass-panel rounded-xl p-3">{sidebar}</div>
        </aside>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={mobileSidebar} onOpenChange={setMobileSidebar}>
          <SheetContent side="left" className="w-[280px] p-4 backdrop-blur-xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="font-display">Menu</SheetTitle>
            </SheetHeader>
            {sidebar}
          </SheetContent>
        </Sheet>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="glass-panel mb-4 flex size-20 items-center justify-center rounded-2xl">
                <Plus className="size-8 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground">Chưa có ghi chú nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhấn nút + để tạo ghi chú đầu tiên
              </p>
            </div>
          ) : (
            <>
              {renderGroup(pinnedNotes, pinnedNotes.length > 0 ? "Đã ghim" : undefined)}
              {renderGroup(otherNotes, pinnedNotes.length > 0 ? "Khác" : undefined)}
            </>
          )}
        </main>
      </div>

      <button
        onClick={() => openEditor(null)}
        className="fab btn-gradient"
        title="Tạo ghi chú mới"
        aria-label="Tạo ghi chú mới"
      >
        <Plus className="size-6" />
      </button>

      <NoteEditor
        note={editingNote}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={user.preferences}
        onUpdate={(prefs) => setUser((prev) => ({ ...prev, preferences: prefs }))}
      />
    </div>
  );
}
