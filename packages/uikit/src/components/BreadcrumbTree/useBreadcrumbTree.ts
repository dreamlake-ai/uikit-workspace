import { useState, useCallback, useRef } from "react";
import type { BreadcrumbNode, FetchChildrenResult, ColumnData } from "./types";

const DEFAULT_COLUMN_DATA: ColumnData = {
  items: [],
  page: 0,
  totalPages: 0,
  hasMore: true,
  loading: false,
  error: null,
};

/**
 * Manages on-demand loading of breadcrumb tree nodes by path.
 * Cache is keyed by path string (e.g. "", "datasets", "datasets/droid-2024").
 */
export function useBreadcrumbTree(
  fetchChildren: (
    path: string,
    page: number,
    limit: number
  ) => Promise<FetchChildrenResult>
) {
  const [cache, setCache] = useState<Map<string, ColumnData>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());

  const fetchPath = useCallback(
    async (
      pathKey: string,
      page = 1,
      limit = 20
    ): Promise<BreadcrumbNode[] | null> => {
      const inflightKey = `${pathKey}::${page}`;
      if (inFlightRef.current.has(inflightKey)) return null;
      inFlightRef.current.add(inflightKey);

      setCache((prev) => {
        const existing = prev.get(pathKey);
        const map = new Map(prev);
        map.set(pathKey, {
          items: page === 1 ? [] : (existing?.items ?? []),
          page: existing?.page ?? 0,
          totalPages: existing?.totalPages ?? 0,
          hasMore: existing?.hasMore ?? true,
          loading: true,
          error: null,
        });
        return map;
      });

      try {
        const result = await fetchChildren(pathKey, page, limit);

        setCache((prev) => {
          const existing = prev.get(pathKey);
          const merged =
            page === 1
              ? result.items
              : [...(existing?.items ?? []), ...result.items];
          const map = new Map(prev);
          map.set(pathKey, {
            items: merged,
            page,
            totalPages: result.totalPages,
            hasMore: page < result.totalPages,
            loading: false,
            error: null,
          });
          return map;
        });

        inFlightRef.current.delete(inflightKey);
        return result.items;
      } catch (err) {
        setCache((prev) => {
          const existing = prev.get(pathKey);
          const map = new Map(prev);
          map.set(pathKey, {
            ...(existing ?? DEFAULT_COLUMN_DATA),
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
          return map;
        });
        inFlightRef.current.delete(inflightKey);
        return null;
      }
    },
    [fetchChildren]
  );

  const loadMore = useCallback(
    async (pathKey: string) => {
      const data = cache.get(pathKey);
      if (!data || !data.hasMore || data.loading) return;
      await fetchPath(pathKey, data.page + 1);
    },
    [cache, fetchPath]
  );

  const getColumnData = useCallback(
    (pathKey: string): ColumnData => cache.get(pathKey) ?? DEFAULT_COLUMN_DATA,
    [cache]
  );

  const clearCache = useCallback(() => {
    setCache(new Map());
    inFlightRef.current.clear();
  }, []);

  return { fetchPath, loadMore, getColumnData, cache, clearCache };
}
