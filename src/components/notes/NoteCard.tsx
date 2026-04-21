import { Pin, Lock, Share2, Image as ImageIcon } from "lucide-react";
import type { Note, NoteColor, ViewMode } from "@/types/note";
import { cn } from "@/lib/utils";

const tintClass: Record<NoteColor, string> = {
  default: "note-tint-default",
  yellow: "note-tint-yellow",
  green: "note-tint-green",
  blue: "note-tint-blue",
  pink: "note-tint-pink",
  purple: "note-tint-purple",
  orange: "note-tint-orange",
  teal: "note-tint-teal",
};

interface NoteCardProps {
  note: Note;
  viewMode: ViewMode;
  onClick: (note: Note) => void;
}

export function NoteCard({ note, viewMode, onClick }: NoteCardProps) {
  const isGrid = viewMode === "grid";

  return (
    <button
      type="button"
      onClick={() => onClick(note)}
      className={cn(
        "note-card-surface group w-full p-4 text-left",
        tintClass[note.color],
        !isGrid && "flex items-start gap-4",
      )}
    >
      <div className={cn(!isGrid && "min-w-0 flex-1")}>
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "truncate font-display font-semibold text-foreground",
              isGrid ? "text-sm" : "text-[15px]",
            )}
          >
            {note.title || "Không có tiêu đề"}
          </h3>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {note.isPinned && <Pin className="size-3.5 fill-primary text-primary" />}
            {note.isLocked && <Lock className="size-3.5 text-muted-foreground" />}
            {note.sharedWith.length > 0 && (
              <Share2 className="size-3.5 text-muted-foreground" />
            )}
            {note.images.length > 0 && (
              <ImageIcon className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        <p
          className={cn(
            "mt-2 whitespace-pre-line text-muted-foreground",
            isGrid ? "text-xs clamp-6" : "text-[13px] clamp-2",
          )}
        >
          {note.content}
        </p>

        {note.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {note.labels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
