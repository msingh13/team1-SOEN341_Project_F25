// src/lib/adminWaitlistPolicy.api.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface WaitlistPolicy {
  id?: number;
  maxSize: number | null;
  autoPromote: boolean;
  enabled: boolean;
  updatedAt?: string;
}

export interface WaitlistAuditItem {
  id: number;
  adminId: number | null;
  changedAt: string;
  oldValue: any;
  newValue: any;
  // optional – if backend ever adds them, UI will pick them up
  eventId?: number | null;
  orgId?: number | null;
  userId?: number | null;
}

export interface WaitlistAuditResponse {
  items: WaitlistAuditItem[];
  page: number;
  pageSize: number;
  total: number;
}

function getAuthHeaders() {
  const token = window.localStorage.getItem("token");
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchWaitlistPolicy(): Promise<WaitlistPolicy | null> {
  const res = await axios.get<{ policy: WaitlistPolicy | null }>(
    `${BASE_URL}/admin/waitlist/policy`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    }
  );
  return res.data.policy;
}

export async function updateWaitlistPolicy(input: {
  maxSize: number | null;
  autoPromote: boolean;
  enabled: boolean;
}): Promise<WaitlistPolicy> {
  const res = await axios.post<{ policy: WaitlistPolicy }>(
    `${BASE_URL}/admin/waitlist/policy`,
    {
      maxSize: input.maxSize,
      autoPromote: input.autoPromote,
      enabled: input.enabled,
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );
  return res.data.policy;
}

export interface AuditFilters {
  eventId?: string;
  orgId?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch audit history with filtering + pagination.
 * NOTE: backend currently supports adminId/from/to/page/pageSize.
 * We still send event/org/user so the API is future-proof.
 */
export async function fetchWaitlistAudit(
  filters: AuditFilters
): Promise<WaitlistAuditResponse> {
  const params: Record<string, string | number> = {};

  if (filters.eventId) params.eventId = filters.eventId;
  if (filters.orgId) params.orgId = filters.orgId;
  if (filters.userId) params.userId = filters.userId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.pageSize = filters.pageSize;

  const res = await axios.get<WaitlistAuditResponse>(
    `${BASE_URL}/admin/waitlist/audit`,
    {
      headers: {
        ...getAuthHeaders(),
      },
      params,
    }
  );

  return res.data;
}
