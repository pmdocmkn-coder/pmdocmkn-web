import type { PagedResult } from "../services/radioApi";

/** Body standar backend: { data: T, message?: string } */
export function unwrapData<T>(res: { data?: { data?: T } }): T | undefined {
  return res.data?.data;
}

/** Hasil paginated: { data: T[], meta: { pagination } } */
export function unwrapPaged<T>(res: any): PagedResult<T> {
  const body = res.data;
  if (body) {
    // Case 1: Filter Backend ResponseWrapperFilter (data and meta are peers in the root body)
    if (body.meta && body.meta.pagination) {
      return {
        data: Array.isArray(body.data) ? body.data : [],
        meta: body.meta
      };
    }
    
    // Case 2: Nested PagedResult (payload has data and meta inside)
    const payload = body.data;
    if (payload && typeof payload === "object" && "meta" in payload) {
      const p = payload as PagedResult<T>;
      return {
        data: Array.isArray(p.data) ? p.data : [],
        meta: p.meta ?? { pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false } },
      };
    }

    // Case 3: Flat array without pagination info
    if (Array.isArray(payload)) {
      return {
        data: payload as T[],
        meta: { pagination: { page: 1, pageSize: 10, totalCount: payload.length, totalPages: 1, hasNext: false, hasPrevious: false } },
      };
    }
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
