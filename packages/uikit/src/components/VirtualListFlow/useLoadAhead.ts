import { useEffect, useReducer, useRef, type RefObject } from "react";

/** Check committed layout, not just scroll events: short pages and resized
 * viewports need to fill too. One attempt per cursor prevents retry storms. */
export function useLoadAhead(
  ref: RefObject<HTMLDivElement | null>,
  {
    key,
    enabled,
    loading,
    threshold,
    load,
  }: {
    key: string | number;
    enabled: boolean;
    loading: boolean;
    threshold: number;
    load?: () => void | Promise<unknown>;
  },
) {
  const attempted = useRef<{ key: string | number } | null>(null);
  const pending = useRef(false);
  const mounted = useRef(false);
  const [, settled] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const node = ref.current;
    if (
      !node ||
      !load ||
      !enabled ||
      loading ||
      pending.current ||
      node.clientHeight <= 0 ||
      attempted.current?.key === key
    )
      return;
    if (
      node.scrollHeight - node.scrollTop - node.clientHeight >
      Math.max(0, threshold)
    )
      return;
    attempted.current = { key };
    pending.current = true;
    try {
      const result = load();
      if (result && typeof result.then === "function") {
        void Promise.resolve(result)
          .catch(() => {})
          .finally(() => {
            pending.current = false;
            if (mounted.current) settled();
          });
      } else pending.current = false;
    } catch {
      // The owner presents errors/retry. A failed cursor never auto-retries.
      pending.current = false;
    }
  });
}
