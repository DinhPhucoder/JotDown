export const NOTE_WORKSPACE_STORAGE_KEY = 'jotdown-note-workspace:v1';
export const NOTE_WORKSPACE_VERSION = 1;

export const noteColorOptions = [
  { value: 'default', label: 'Mac dinh', swatch: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)' },
  { value: 'yellow', label: 'Vang', swatch: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)' },
  { value: 'green', label: 'Xanh la', swatch: 'linear-gradient(135deg, #bbf7d0 0%, #10b981 100%)' },
  { value: 'blue', label: 'Xanh duong', swatch: 'linear-gradient(135deg, #bfdbfe 0%, #2563eb 100%)' },
  { value: 'pink', label: 'Hong', swatch: 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)' },
  { value: 'purple', label: 'Tim', swatch: 'linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%)' },
  { value: 'orange', label: 'Cam', swatch: 'linear-gradient(135deg, #fed7aa 0%, #f97316 100%)' },
  { value: 'teal', label: 'Xanh ngoc', swatch: 'linear-gradient(135deg, #99f6e4 0%, #0f766e 100%)' },
];

export const fontSizeOptions = [
  { value: 'small', label: 'Nho' },
  { value: 'medium', label: 'Vua' },
  { value: 'large', label: 'Lon' },
];

export const mockUser = {
  id: '1',
  email: 'user@example.com',
  displayName: 'Nguyen Van A',
  isVerified: false,
  preferences: {
    fontSize: 'medium',
    defaultNoteColor: 'default',
  },
};

export const mockLabels = [
  { id: '1', name: 'Cong viec' },
  { id: '2', name: 'Ca nhan' },
  { id: '3', name: 'Hoc tap' },
  { id: '4', name: 'Y tuong' },
  { id: '5', name: 'Quan trong' },
];

export const mockNotes = [
  {
    id: '1',
    title: 'Ke hoach du an web',
    content:
      'Hoan thanh frontend voi React va Bootstrap. Ket noi API Laravel. Chuan bi bo test cho cac luong dang nhap va ghi chu.',
    color: 'blue',
    isPinned: true,
    pinnedAt: '2026-04-18T10:00:00Z',
    isLocked: false,
    labels: ['Cong viec', 'Quan trong'],
    images: [],
    sharedWith: [{ email: 'partner@example.com', permission: 'edit', sharedAt: '2026-04-17T08:00:00Z' }],
    createdAt: '2026-04-12T08:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
  },
  {
    id: '2',
    title: 'Danh sach mua sam',
    content: '- Sua\n- Trung\n- Banh mi\n- Rau xanh\n- Ca hoi',
    color: 'green',
    isPinned: false,
    isLocked: false,
    labels: ['Ca nhan'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-13T14:00:00Z',
    updatedAt: '2026-04-13T14:00:00Z',
  },
  {
    id: '3',
    title: 'Ghi chu bai giang lap trinh web',
    content:
      'React hooks, data fetching, optimistic UI va cach tach component theo trach nhiem de de maintain.',
    color: 'purple',
    isPinned: true,
    pinnedAt: '2026-04-19T09:00:00Z',
    isLocked: false,
    labels: ['Hoc tap'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-09T09:00:00Z',
    updatedAt: '2026-04-19T11:00:00Z',
  },
  {
    id: '4',
    title: 'Y tuong tinh nang moi',
    content:
      'Them bo loc theo deadline, timeline cong viec va mot dashboard tong hop de xem muc do hoan thanh.',
    color: 'orange',
    isPinned: false,
    isLocked: true,
    lockPassword: '1234',
    labels: ['Y tuong'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-11T16:00:00Z',
    updatedAt: '2026-04-15T20:00:00Z',
  },
  {
    id: '5',
    title: 'Lich hop tuan nay',
    content: 'Thu 2: hop sprint 9:00\nThu 4: review design 14:00\nThu 6: demo tinh nang 10:00',
    color: 'teal',
    isPinned: false,
    isLocked: false,
    labels: ['Cong viec'],
    images: [],
    sharedWith: [{ email: 'manager@example.com', permission: 'read', sharedAt: '2026-04-14T07:00:00Z' }],
    createdAt: '2026-04-14T07:00:00Z',
    updatedAt: '2026-04-14T07:30:00Z',
  },
  {
    id: '6',
    title: 'Muc tieu quy 2',
    content: 'Ship note app, hoan tat login flow, toi uu responsive va viet smoke test cho build.',
    color: 'pink',
    isPinned: false,
    isLocked: false,
    labels: ['Ca nhan', 'Quan trong'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-04-21T12:00:00Z',
  },
];

function sanitizeNote(note) {
  if (!note || typeof note !== 'object') {
    return null;
  }

  return {
    id: String(note.id || crypto.randomUUID()),
    title: String(note.title || ''),
    content: String(note.content || ''),
    color: typeof note.color === 'string' ? note.color : 'default',
    isPinned: Boolean(note.isPinned),
    pinnedAt: note.pinnedAt ? String(note.pinnedAt) : undefined,
    isLocked: Boolean(note.isLocked),
    lockPassword: note.lockPassword ? String(note.lockPassword) : '',
    labels: Array.isArray(note.labels) ? note.labels.filter(Boolean).map(String) : [],
    images: Array.isArray(note.images) ? note.images.filter(Boolean).map(String) : [],
    sharedWith: Array.isArray(note.sharedWith)
      ? note.sharedWith
          .filter(Boolean)
          .map((entry) => ({
            email: String(entry.email || ''),
            permission: entry.permission === 'edit' ? 'edit' : 'read',
            sharedAt: String(entry.sharedAt || new Date().toISOString()),
          }))
      : [],
    createdAt: String(note.createdAt || new Date().toISOString()),
    updatedAt: String(note.updatedAt || new Date().toISOString()),
  };
}

function sanitizeUser(user) {
  return {
    ...mockUser,
    ...user,
    preferences: {
      ...mockUser.preferences,
      ...(user?.preferences || {}),
    },
  };
}

function getDefaultWorkspace() {
  return {
    notes: mockNotes,
    labels: mockLabels,
    user: mockUser,
    viewMode: 'grid',
  };
}

export function loadNoteWorkspace() {
  if (typeof window === 'undefined') {
    return getDefaultWorkspace();
  }

  try {
    const raw = window.localStorage.getItem(NOTE_WORKSPACE_STORAGE_KEY);

    if (!raw) {
      return getDefaultWorkspace();
    }

    const parsed = JSON.parse(raw);

    if (parsed.version !== NOTE_WORKSPACE_VERSION) {
      return getDefaultWorkspace();
    }

    return {
      notes: Array.isArray(parsed.notes) ? parsed.notes.map(sanitizeNote).filter(Boolean) : mockNotes,
      labels: Array.isArray(parsed.labels)
        ? parsed.labels
            .filter((label) => label && typeof label === 'object')
            .map((label) => ({
              id: String(label.id || crypto.randomUUID()),
              name: String(label.name || ''),
            }))
        : mockLabels,
      user: sanitizeUser(parsed.user),
      viewMode: parsed.viewMode === 'list' ? 'list' : 'grid',
    };
  } catch {
    return getDefaultWorkspace();
  }
}

export function saveNoteWorkspace(workspace) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    version: NOTE_WORKSPACE_VERSION,
    notes: workspace.notes,
    labels: workspace.labels,
    user: workspace.user,
    viewMode: workspace.viewMode,
  };

  window.localStorage.setItem(NOTE_WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
}
