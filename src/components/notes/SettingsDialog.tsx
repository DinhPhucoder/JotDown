import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserPreferences, NoteColor } from "@/types/note";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
}

export function SettingsDialog({ open, onClose, preferences, onUpdate }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-border/60 bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-semibold">Cài đặt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cỡ chữ ghi chú
            </Label>
            <Select
              value={preferences.fontSize}
              onValueChange={(v) =>
                onUpdate({ ...preferences, fontSize: v as UserPreferences["fontSize"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Nhỏ</SelectItem>
                <SelectItem value="medium">Vừa</SelectItem>
                <SelectItem value="large">Lớn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Màu ghi chú mặc định
            </Label>
            <Select
              value={preferences.defaultNoteColor}
              onValueChange={(v) =>
                onUpdate({ ...preferences, defaultNoteColor: v as NoteColor })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Mặc định</SelectItem>
                <SelectItem value="yellow">Vàng</SelectItem>
                <SelectItem value="green">Xanh lá</SelectItem>
                <SelectItem value="blue">Xanh dương</SelectItem>
                <SelectItem value="pink">Hồng</SelectItem>
                <SelectItem value="purple">Tím</SelectItem>
                <SelectItem value="orange">Cam</SelectItem>
                <SelectItem value="teal">Xanh ngọc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
