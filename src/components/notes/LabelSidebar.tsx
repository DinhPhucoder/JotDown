import { useState } from "react";
import { Plus, Tag, Pencil, X, StickyNote, Share2, Check } from "lucide-react";
import type { Label } from "@/types/note";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface LabelSidebarProps {
  labels: Label[];
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  onAddLabel: (name: string) => void;
  onRenameLabel: (id: string, name: string) => void;
  onDeleteLabel: (id: string) => void;
  showShared: boolean;
  onToggleShared: () => void;
  onShowAll: () => void;
}

export function LabelSidebar({
  labels,
  selectedLabels,
  onToggleLabel,
  onAddLabel,
  onRenameLabel,
  onDeleteLabel,
  showShared,
  onToggleShared,
  onShowAll,
}: LabelSidebarProps) {
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const isAllActive = selectedLabels.length === 0 && !showShared;

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (trimmed) {
      onAddLabel(trimmed);
      setNewLabel("");
    }
  };

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameLabel(editingId, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <nav className="space-y-1">
      <SidebarItem
        active={isAllActive}
        onClick={onShowAll}
        icon={<StickyNote className="size-4" />}
        label="Tất cả ghi chú"
      />
      <SidebarItem
        active={showShared}
        onClick={onToggleShared}
        icon={<Share2 className="size-4" />}
        label="Được chia sẻ"
      />

      <div className="pt-5">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Nhãn
        </p>
        <div className="space-y-1">
          {labels.map((label) => {
            const isActive = selectedLabels.includes(label.name);
            if (editingId === label.id) {
              return (
                <div key={label.id} className="flex items-center gap-1 px-2 py-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    autoFocus
                    className="h-8 text-sm"
                  />
                  <button
                    onClick={saveEdit}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Lưu"
                  >
                    <Check className="size-4" />
                  </button>
                </div>
              );
            }
            return (
              <div key={label.id} className="group relative">
                <SidebarItem
                  active={isActive}
                  onClick={() => onToggleLabel(label.name)}
                  icon={<Tag className="size-3.5" />}
                  label={label.name}
                  trailing={
                    <span className="ml-auto flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(label);
                        }}
                        className="rounded p-1 hover:bg-foreground/10"
                        aria-label="Sửa"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLabel(label.id);
                        }}
                        className="rounded p-1 hover:bg-foreground/10"
                        aria-label="Xoá"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-1 px-2">
          <Input
            placeholder="Nhãn mới..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-8 text-sm"
          />
          <button
            onClick={handleAdd}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Thêm nhãn"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function SidebarItem({
  active,
  onClick,
  icon,
  label,
  trailing,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        active &&
          "bg-gradient-to-r from-primary/20 to-primary-glow/10 text-foreground font-medium ring-1 ring-primary/30",
      )}
    >
      <span className={cn(active && "text-primary")}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}
