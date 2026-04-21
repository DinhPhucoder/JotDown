export type NoteColor =
  | "default"
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "purple"
  | "orange"
  | "teal";

export type ViewMode = "grid" | "list";

export interface SharedWith {
  email: string;
  permission: "read" | "edit";
  sharedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  pinnedAt?: string;
  isLocked: boolean;
  labels: string[];
  images: string[];
  sharedWith: SharedWith[];
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
}

export interface UserPreferences {
  fontSize: "small" | "medium" | "large";
  defaultNoteColor: NoteColor;
  theme: "light" | "dark";
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  isVerified: boolean;
  preferences: UserPreferences;
}
