import type { PagedResult } from "../services/radioApi";

/** Body standar backend: { data: T, message?: string } */
export function unwrapData<T>(res: { data?: { data?: T } }): T | undefined {
  return res.data?.data;
}

/** Hasil paginated: { data: T[], meta: { pagination } } */
export function unwrapPaged<T>(res: { data?: { data?: unknown } }): PagedResult<T> {
  const payload = res.data?.data;
  if (payload && typeof payload === "object" && "data" in payload) {
    const p = payload as PagedResult<T>;
    return {
      data: Array.isArray(p.data) ? p.data : [],
      meta: p.meta ?? { pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false } },
    };
  }
  if (Array.isArray(payload)) {
    return {
      data: payload as T[],
      meta: { pagination: { page: 1, pageSize: 10, totalCount: payload.length, totalPages: 1, hasNext: false, hasPrevious: false } },
    };
  }
  return {
    data: [],
    meta: { pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false } },
  };
}

export function unwrapList<T>(res: { data?: { data?: unknown } }): T[] {
  const payload = res.data?.data;
  if (Array.isArray(payload)) return payload as T[];
  return [];
}
