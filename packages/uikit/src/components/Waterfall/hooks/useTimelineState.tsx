import { useState, useMemo } from "react";

import { type LogItemType, type LogItemWithMeta } from "../types";

/**
 * Manages timeline waterfall state: item expansion, hover, and hierarchical
 * (parent/child) processing. Returns the expanded set, hover id, a toggle fn,
 * the data enriched with ancestor chains, and a visible-row filter.
 */
export function useTimelineState(logData: LogItemType[]) {
  const [expandedItems, setExpandedItems] = useState(() => {
    const initial = new Set<string>();
    logData.forEach((item) => {
      if (item.isCollapsible) initial.add(item.id);
    });
    return initial;
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const childrenMap = useMemo(() => {
    const map = new Map<string | null | undefined, LogItemType[]>();
    logData.forEach((item) => {
      if (!map.has(item.parentId)) {
        map.set(item.parentId, []);
      }
      map.get(item.parentId)!.push(item);
    });
    return map;
  }, [logData]);

  const logDataWithMeta = useMemo(() => {
    const dataMap = new Map(logData.map((item) => [item.id, item]));

    const getAncestors = (item: LogItemType) => {
      const ancestors: LogItemType[] = [];
      let current = item.parentId;
      while (current) {
        const parent = dataMap.get(current);
        if (parent) {
          ancestors.unshift(parent);
          current = parent.parentId;
        } else {
          break;
        }
      }
      return ancestors;
    };

    return logData.map((item) => {
      const siblings = childrenMap.get(item.parentId) || [];
      const isLast =
        siblings.length > 0 && siblings[siblings.length - 1].id === item.id;
      const ancestors = getAncestors(item);
      return { ...item, isLast, ancestors };
    });
  }, [childrenMap, logData]);

  const isVisible = (item: { ancestors: LogItemType[] }) => {
    return item.ancestors.every(
      (ancestor) => !ancestor.isCollapsible || expandedItems.has(ancestor.id),
    );
  };

  const getVisibleLogData = (filteredData: LogItemWithMeta[]) => {
    return filteredData.filter(isVisible);
  };

  return {
    expandedItems,
    hoveredId,
    setHoveredId,
    toggleItem,
    logDataWithMeta,
    getVisibleLogData,
  };
}
