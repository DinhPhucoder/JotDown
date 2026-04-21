import { useState, useEffect, useCallback, useRef } from "react";
import { Pin, Palette, Image as ImageIcon, Lock, Share2, Trash2, Check } from "lucide-react";
import type { Note, NoteColor } from "@/types/note";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const colors: { name: NoteColor; tint: string }[] = [
  { name: "default", tint: "bg-secondary" },
  { name: "yellow", tint: "bg-yellow-400/40" },
  { name: "green", tint: "bg-emerald-400/40" },
  { name: "blue", tint: "bg-blue-500/40" },
  { name: "pink", tint: "bg-pink-400/40" },
  { name: "purple", tint: "bg-violet-500/40" },
  { name: "orange", tint: "bg-orange-400/40" },
  { name: "teal", tint: "bg-teal-400/40" },
];

interface NoteEditorProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NoteEditor({ note, open, onClose, onSave, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<NoteColor>("default");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const noteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setIsPinned(note.isPinned);
      noteIdRef.current = note.id;
    } else {
      setTitle("");
      setContent("");
      setColor("default");
      setIsPinned(false);
      noteIdRef.current = null;
    }
    setShowColors(false);
  }, [note, open]);

  const autoSave = useCallback(() => {
    if (!title && !content) return;
    setSaving(true);
    const now = new Date().toISOString();
    if (!noteIdRef.current) noteIdRef.current = crypto.randomUUID();
    const updated: Note = {
      id: noteIdRef.current,
      title,
      content,
      color,
      isPinned,
      pinnedAt: isPinned ? note?.pinnedAt || now : undefined,
      isLocked: note?.isLocked || false,
      labels: note?.labels || [],
      images: note?.images || [],
      sharedWith: note?.sharedWith || [],
      createdAt: note?.createdAt || now,
      updatedAt: now,
    };
    onSave(updated);
    setTimeout(() => setSaving(false), 500);
  }, [title, content, color, isPinned, note, onSave]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(autoSave, 800);
    return () => clearTimeout(timer);
  }, [title, content, color, isPinned, open, autoSave]);

  const handleDelete = () => {
    if (note && window.confirm("Bạn có chắc muốn xoá ghi chú này?")) {
      onDelete(note.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl border-border/60 bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-semibold">
            {note ? "Chỉnh sửa ghi chú" : "Ghi chú mới"}
          </DialogTitle>
        </DialogHeader>

        <input
          type="text"
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-display text-xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <textarea
          placeholder="Nội dung ghi chú..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={9}
          className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="relative flex items-center gap-1">
            <ToolBtn
              onClick={() => setIsPinned(!isPinned)}
              active={isPinned}
              title={isPinned ? "Bỏ ghim" : "Ghim"}
            >
              <Pin className={cn("size-4", isPinned && "fill-current")} />
            </ToolBtn>

            <div className="relative">
              <ToolBtn onClick={() => setShowColors((s) => !s)} title="Màu sắc">
                <Palette className="size-4" />
              </ToolBtn>
              {showColors && (
                <div className="absolute bottom-full left-0 z-10 mb-2 flex gap-1 rounded-lg border border-border/60 bg-popover/95 p-2 shadow-lg backdrop-blur-xl">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setColor(c.name);
                        setShowColors(false);
                      }}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border-2 border-transparent transition",
                        c.tint,
                        color === c.name && "border-primary",
                      )}
                      aria-label={c.name}
                    >
                      {color === c.name && <Check className="size-3 text-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ToolBtn title="Hình ảnh">
              <ImageIcon className="size-4" />
            </ToolBtn>
            <ToolBtn title="Khoá">
              <Lock className="size-4" />
            </ToolBtn>
            <ToolBtn title="Chia sẻ">
              <Share2 className="size-4" />
            </ToolBtn>
            {note && (
              <ToolBtn onClick={handleDelete} title="Xoá" tone="destructive">
                <Trash2 className="size-4" />
              </ToolBtn>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {saving ? "Đang lưu..." : "Đã lưu"}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolBtn({
  onClick,
  active,
  title,
  tone,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  tone?: "destructive";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground",
        active && "text-primary",
        tone === "destructive" && "hover:bg-destructive/15 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}
