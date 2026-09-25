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
    limit: number,
  ) => Promise<FetchChildrenResult>,
) {
  const [cache, setCache] = useState<Map<string, ColumnData>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());

  const fetchPath = useCallback(
    async (
      pathKey: string,
      page = 1,
      limit = 20,
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
    [fetchChildren],
  );

  const loadMore = useCallback(
    async (pathKey: string) => {
      const data = cache.get(pathKey);
      if (!data || !data.hasMore || data.loading) return;
      await fetchPath(pathKey, data.page + 1);
    },
    [cache, fetchPath],
  );

  const getColumnData = useCallback(
    (pathKey: string): ColumnData => cache.get(pathKey) ?? DEFAULT_COLUMN_DATA,
    [cache],
  );

  /**
   * Re-parent a node inside the cache, without refetching anything.
   *
   * The alternative — invalidate and refetch — is what makes a drag look like
   * a page load: every column that had been opened comes back empty and then
   * repopulates, so the whole panel flickers to report a change of one row's
   * parent. Nothing else about the tree moved, and the cache already holds
   * everything needed to say so.
   *
   * Three things have to happen together, which is why this is one call:
   *
   *   1. the node leaves `fromKey`'s items and joins `toKey`'s;
   *   2. its DESCENDANTS' cache keys change, because the keys are name paths
   *      and the node's own path just changed. They are re-keyed in place —
   *      the subtree's contents are untouched, so a branch that was expanded
   *      before the drag is still expanded, and still populated, after it;
   *   3. the new parent is marked as having children, so its chevron appears
   *      even if it was empty and had none.
   *
   * `fromKey`/`toKey` may be absent from the cache (a column never opened);
   * that side is simply skipped and will fetch correctly when it is.
   */
  const applyMove = useCallback(
    ({
      node,
      fromKey,
      toKey,
      oldPrefix,
      newPrefix,
      newParentId,
    }: {
      node: BreadcrumbNode;
      fromKey: string;
      toKey: string;
      /** The moved node's own cache key BEFORE the move. */
      oldPrefix: string;
      /** ...and after. Its whole subtree is re-keyed across this pair. */
      newPrefix: string;
      /** `null` when the destination is the root. */
      newParentId: string | null;
    }) => {
      setCache((prev) => {
        const map = new Map(prev);

        const src = map.get(fromKey);
        if (src)
          map.set(fromKey, {
            ...src,
            items: src.items.filter((n) => n.id !== node.id),
          });

        const dst = map.get(toKey);
        if (dst && !dst.items.some((n) => n.id === node.id))
          map.set(toKey, { ...dst, items: [...dst.items, node] });

        // Collect before writing. A re-keyed entry can land on a key that is
        // itself still waiting to be moved — writing as we go would clobber it
        // and then delete the clobbered copy.
        if (oldPrefix !== newPrefix) {
          const moved: [string, ColumnData][] = [];
          for (const [k, v] of map) {
            if (k === oldPrefix || k.startsWith(`${oldPrefix}/`))
              moved.push([newPrefix + k.slice(oldPrefix.length), v]);
          }
          for (const k of [...map.keys()])
            if (k === oldPrefix || k.startsWith(`${oldPrefix}/`)) map.delete(k);
          for (const [k, v] of moved) map.set(k, v);
        }

        if (newParentId) {
          for (const [k, v] of map) {
            if (
              !v.items.some(
                (n) => n.id === newParentId && n.hasChildren === false,
              )
            )
              continue;
            map.set(k, {
              ...v,
              items: v.items.map((n) =>
                n.id === newParentId ? { ...n, hasChildren: true } : n,
              ),
            });
          }
        }

        return map;
      });
    },
    [],
  );

  const clearCache = useCallback(() => {
    setCache(new Map());
    inFlightRef.current.clear();
  }, []);

  return { fetchPath, loadMore, getColumnData, applyMove, cache, clearCache };
}
