export const NOTE_WORKSPACE_STORAGE_KEY = 'jotdown-note-workspace:v1';
export const NOTE_WORKSPACE_VERSION = 1;

export const noteColorOptions = [
  { value: 'default', label: 'Mặc định', swatch: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)' },
  { value: 'yellow', label: 'Vàng', swatch: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)' },
  { value: 'green', label: 'Xanh lá', swatch: 'linear-gradient(135deg, #bbf7d0 0%, #10b981 100%)' },
  { value: 'blue', label: 'Xanh dương', swatch: 'linear-gradient(135deg, #bfdbfe 0%, #2563eb 100%)' },
  { value: 'pink', label: 'Hồng', swatch: 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)' },
  { value: 'purple', label: 'Tím', swatch: 'linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%)' },
  { value: 'orange', label: 'Cam', swatch: 'linear-gradient(135deg, #fed7aa 0%, #f97316 100%)' },
  { value: 'teal', label: 'Xanh ngọc', swatch: 'linear-gradient(135deg, #99f6e4 0%, #0f766e 100%)' },
];

export const fontSizeOptions = [
  { value: 'small', label: 'Nhỏ' },
  { value: 'medium', label: 'Vừa' },
  { value: 'large', label: 'Lớn' },
];

export const mockUser = {
  id: '1',
  email: 'user@example.com',
  displayName: 'Nguyễn Văn A',
  isVerified: false,
  preferences: {
    fontSize: 'medium',
    defaultNoteColor: 'default',
  },
};

export const mockLabels = [
  { id: '1', name: 'Công việc' },
  { id: '2', name: 'Cá nhân' },
  { id: '3', name: 'Học tập' },
  { id: '4', name: 'Ý tưởng' },
  { id: '5', name: 'Quan trọng' },
];

export const mockNotes = [
  {
    id: '1',
    title: 'Kế hoạch dự án web',
    content:
      'Hoàn thành frontend với React và Bootstrap. Kết nối API Laravel. Chuẩn bị bộ test cho các luồng đăng nhập và ghi chú.',
    color: 'blue',
    isPinned: true,
    pinnedAt: '2026-04-18T10:00:00Z',
    isLocked: false,
    labels: ['Công việc', 'Quan trọng'],
    images: [],
    sharedWith: [{ email: 'partner@example.com', permission: 'edit', sharedAt: '2026-04-17T08:00:00Z' }],
    createdAt: '2026-04-12T08:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
  },
  {
    id: '2',
    title: 'Danh sách mua sắm',
    content: '- Sữa\n- Trứng\n- Bánh mì\n- Rau xanh\n- Cá hồi',
    color: 'green',
    isPinned: false,
    isLocked: false,
    labels: ['Cá nhân'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-13T14:00:00Z',
    updatedAt: '2026-04-13T14:00:00Z',
  },
  {
    id: '3',
    title: 'Ghi chú bài giảng lập trình web',
    content:
      'React hooks, data fetching, optimistic UI và cách tách component theo trách nhiệm để dễ maintain.',
    color: 'purple',
    isPinned: true,
    pinnedAt: '2026-04-19T09:00:00Z',
    isLocked: false,
    labels: ['Học tập'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-09T09:00:00Z',
    updatedAt: '2026-04-19T11:00:00Z',
  },
  {
    id: '4',
    title: 'Ý tưởng tính năng mới',
    content:
      'Thêm bộ lọc theo deadline, timeline công việc và một dashboard tổng hợp để xem mức độ hoàn thành.',
    color: 'orange',
    isPinned: false,
    isLocked: true,
    lockPassword: '1234',
    labels: ['Ý tưởng'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-11T16:00:00Z',
    updatedAt: '2026-04-15T20:00:00Z',
  },
  {
    id: '5',
    title: 'Lịch họp tuần này',
    content: 'Thứ 2: họp sprint 9:00\nThứ 4: review design 14:00\nThứ 6: demo tính năng 10:00',
    color: 'teal',
    isPinned: false,
    isLocked: false,
    labels: ['Công việc'],
    images: [],
    sharedWith: [{ email: 'manager@example.com', permission: 'read', sharedAt: '2026-04-14T07:00:00Z' }],
    createdAt: '2026-04-14T07:00:00Z',
    updatedAt: '2026-04-14T07:30:00Z',
  },
  {
    id: '6',
    title: 'Mục tiêu quý 2',
    content: 'Ship note app, hoàn tất login flow, tối ưu responsive và viết smoke test cho build.',
    color: 'pink',
    isPinned: false,
    isLocked: false,
    labels: ['Cá nhân', 'Quan trọng'],
    images: [],
    sharedWith: [],
    createdAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-04-21T12:00:00Z',
  },
  {
    id: '7',
    title: 'Checklist release từ Team Product',
    content: 'Chốt changelog, đối soát KPI và xác nhận tài liệu hướng dẫn trước khi release bản mới.',
    color: 'default',
    isPinned: false,
    isLocked: false,
    labels: ['Công việc'],
    images: [],
    ownerEmail: 'pm@example.com',
    ownerName: 'Lê Product Owner',
    accessPermission: 'read',
    sharedWith: [{ email: 'user@example.com', permission: 'read', sharedAt: '2026-04-24T09:00:00Z' }],
    createdAt: '2026-04-24T09:00:00Z',
    updatedAt: '2026-04-24T09:30:00Z',
  },
];

function sanitizeNote(note) {
  if (!note || typeof note !== 'object') {
    return null;
  }

  const isLocked = Boolean(note.isLocked);
  const lockPassword = note.lockPassword ? String(note.lockPassword) : '';
  const normalizedSharedWith = Array.isArray(note.sharedWith)
    ? note.sharedWith
        .filter(Boolean)
        .map((entry) => ({
          email: String(entry.email || ''),
          permission: entry.permission === 'edit' ? 'edit' : 'read',
          sharedAt: String(entry.sharedAt || new Date().toISOString()),
        }))
    : [];

  return {
    id: String(note.id || crypto.randomUUID()),
    title: String(note.title || ''),
    content: String(note.content || ''),
    color: typeof note.color === 'string' ? note.color : 'default',
    isPinned: Boolean(note.isPinned),
    pinnedAt: note.pinnedAt ? String(note.pinnedAt) : undefined,
    isLocked,
    lockPassword: isLocked ? lockPassword : '',
    labels: Array.isArray(note.labels) ? note.labels.filter(Boolean).map(String) : [],
    images: Array.isArray(note.images) ? note.images.filter(Boolean).map(String) : [],
    // Mutual exclusive invariant: locked notes cannot be shared.
    sharedWith: isLocked ? [] : normalizedSharedWith,
    ownerEmail: note.ownerEmail ? String(note.ownerEmail).trim().toLowerCase() : undefined,
    ownerName: note.ownerName ? String(note.ownerName) : undefined,
    accessPermission:
      note.accessPermission === 'edit' || note.accessPermission === 'read'
        ? note.accessPermission
        : undefined,
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

function ensureSharedDemoNote(notes) {
  const sanitizedNotes = Array.isArray(notes) ? notes.map(sanitizeNote).filter(Boolean) : [];
  const hasReceivedSharedNote = sanitizedNotes.some((note) => {
    const ownerEmail = String(note.ownerEmail || '').trim().toLowerCase();
    const hasViewer = Array.isArray(note.sharedWith)
      ? note.sharedWith.some((entry) => String(entry.email || '').trim().toLowerCase() === mockUser.email)
      : false;

    return ownerEmail && ownerEmail !== mockUser.email && hasViewer;
  });

  if (hasReceivedSharedNote) {
    return sanitizedNotes;
  }

  const demoSharedNote = sanitizeNote(mockNotes.find((note) => note.id === '7'));

  if (!demoSharedNote) {
    return sanitizedNotes;
  }

  const hasSameId = sanitizedNotes.some((note) => note.id === demoSharedNote.id);

  if (hasSameId) {
    return sanitizedNotes.map((note) => (note.id === demoSharedNote.id ? demoSharedNote : note));
  }

  return [demoSharedNote, ...sanitizedNotes];
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
      notes: ensureSharedDemoNote(Array.isArray(parsed.notes) ? parsed.notes : mockNotes),
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
