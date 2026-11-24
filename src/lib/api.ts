import { auth } from './firebase';
import type {
  Branch,
  ExchangeType,
  HealthStatus,
  ImpactStats,
  ItemCategory,
  ItemCondition,
  ItemReport,
  ItemRequest,
  ModerationStatus,
  PickupPointName,
  Profile,
  ReportStatus,
  ResourceItem,
  Semester,
} from '../types/campuscycle';

let memoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  memoryToken = token;
}

export function getAuthToken(): string | null {
  return memoryToken;
}

async function resolveBearerToken(): Promise<string | null> {
  if (auth.currentUser) {
    try {
      const fresh = await auth.currentUser.getIdToken();
      memoryToken = fresh;
      return fresh;
    } catch {
      return memoryToken;
    }
  }
  return memoryToken;
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = await resolveBearerToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getHealth: () => requestJson<HealthStatus>('/api/health'),
  getImpact: () => requestJson<ImpactStats>('/api/impact'),

  // Auth & Profile
  getMe: () => requestJson<{ profile: Profile }>('/api/auth/me'),

  updateProfile: (payload: Partial<Profile>) =>
    requestJson<{ profile: Profile }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Upload
  uploadImage: (payload: {
    fileName: string;
    mimeType: string;
    dataBase64: string;
  }) =>
    requestJson<{ url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Items
  listItems: (params?: {
    q?: string;
    branch?: string;
    semester?: string;
    category?: string;
    condition?: string;
    exchangeType?: string;
    availableOnly?: boolean;
    sort?: string;
    ownerId?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== 'ALL') {
          sp.set(k, String(v));
        }
      }
    }
    const qs = sp.toString();
    return requestJson<{ items: ResourceItem[] }>(
      `/api/items${qs ? `?${qs}` : ''}`
    );
  },

  getItem: (id: string) => requestJson<{ item: ResourceItem }>(`/api/items/${id}`),

  createItem: (payload: {
    title: string;
    description: string;
    category: ItemCategory;
    branch: Branch;
    semester: Semester;
    condition: ItemCondition;
    exchangeType: ExchangeType;
    price: number;
    estimatedRetailPrice: number;
    quantity: number;
    imageUrl: string;
    isAvailable: boolean;
  }) =>
    requestJson<{ item: ResourceItem }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateItem: (id: string, payload: Partial<ResourceItem>) =>
    requestJson<{ item: ResourceItem }>(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteItem: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/items/${id}`, {
      method: 'DELETE',
    }),

  // Requests & Pickups & Handovers
  listRequests: (scope: 'mine' | 'incoming' | 'all' = 'all') =>
    requestJson<{ requests: ItemRequest[] }>(`/api/requests?scope=${scope}`),

  createRequest: (payload: { itemId: string; message: string }) =>
    requestJson<{ request: ItemRequest }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  actOnRequest: (id: string, action: 'accept' | 'reject' | 'cancel') =>
    requestJson<{ request: ItemRequest }>(`/api/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),

  savePickup: (
    requestId: string,
    payload: {
      pickupPoint: PickupPointName;
      pickupDate: string;
      pickupTime: string;
      instructions: string;
    }
  ) =>
    requestJson<{ request: ItemRequest }>(`/api/pickups/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  confirmHandover: (requestId: string) =>
    requestJson<{ request: ItemRequest }>(
      `/api/handovers/${requestId}/confirm`,
      { method: 'POST' }
    ),

  // Reports
  createReport: (payload: { itemId: string; reason: string; details: string }) =>
    requestJson<{ report: ItemReport }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin
  getAdminOverview: () =>
    requestJson<{
      users: Profile[];
      items: ResourceItem[];
      requests: ItemRequest[];
      reports: ItemReport[];
      impact: ImpactStats;
    }>('/api/admin/overview'),

  adminUpdateUser: (id: string, isActive: boolean) =>
    requestJson<{ user: Profile }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  adminModerateItem: (id: string, moderationStatus: ModerationStatus) =>
    requestJson<{ item: ResourceItem }>(`/api/admin/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ moderationStatus }),
    }),

  adminResolveReport: (
    id: string,
    payload: { status: ReportStatus; adminNote: string; removeItem?: boolean }
  ) =>
    requestJson<{ report: ItemReport }>(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
