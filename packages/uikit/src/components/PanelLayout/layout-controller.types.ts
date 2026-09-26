/** Serializable intent API. Application payloads must contain descriptors, never credentials. */
export type LayoutValue = string | number | boolean | null;
export interface LayoutView {
  kind: string;
  resource: string;
  title?: string;
  content?: Record<string, LayoutValue>;
}
export interface LayoutTabMetadata {
  view?: LayoutView;
  names?: string[];
  role?: string;
  pinned?: boolean;
  preview?: boolean;
}
export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface LayoutQuery {
  id?: string;
  name?: string;
  role?: string;
  scope?: string;
  descendants?: boolean;
  level?: "panel" | "area";
  spanning?: string[];
  content?: Record<string, LayoutValue>;
  visibility?: "contains" | "displays";
  empty?: boolean;
  replaceable?: boolean;
  minWidth?: number;
  minHeight?: number;
  direction?: "right" | "left" | "above" | "below";
  from?: string;
  select?:
    | "unique"
    | "first"
    | "last"
    | "original"
    | "closest"
    | "largest"
    | "smallest";
}
export type LayoutPlacement = "tab" | "right" | "left" | "above" | "below";
export interface LayoutOpenRequest {
  action: "open";
  view: LayoutView;
  destination: LayoutQuery;
  placement?: LayoutPlacement;
  reuse?: "existing" | "new-instance";
  mode?: "tab" | "preview";
  name?: string;
  role?: string;
  fallback?: { destination: LayoutQuery; placement: LayoutPlacement };
  ifRevision?: number;
}
export type LayoutRequest =
  | LayoutOpenRequest
  | { action: "pin"; tabId: string; pinned: boolean; ifRevision?: number }
  | { action: "activate" | "close"; tabId: string; ifRevision?: number }
  | {
      action: "name";
      destination: LayoutQuery;
      name: string;
      ifRevision?: number;
    }
  | {
      action: "move";
      tabId: string;
      destination: LayoutQuery;
      placement: LayoutPlacement;
      ifRevision?: number;
    };
export interface LayoutTabInfo {
  id: string;
  active: boolean;
  pinned: boolean;
  preview: boolean;
  role?: string;
  view?: LayoutView;
}
export interface LayoutRegionInfo {
  id: string;
  nodeId: string;
  level: "panel" | "area";
  parentId?: string;
  names: string[];
  roles: string[];
  created: number;
  originalNames: string[];
  bounds: LayoutRect;
  tabs: LayoutTabInfo[];
}
export interface LayoutSnapshot {
  version: 1;
  revision: number;
  geometry: "pixels" | "normalized";
  regions: LayoutRegionInfo[];
}
export interface LayoutResolution {
  status: "ready" | "not-found" | "ambiguous" | "stale" | "invalid";
  revision: number;
  reason: string;
  candidates: string[];
  panelId?: string;
  tabId?: string;
  effect?:
    | "activate"
    | "create"
    | "replace"
    | "pin"
    | "close"
    | "name"
    | "move";
  placement?: LayoutPlacement;
}
export interface LayoutResult extends Omit<LayoutResolution, "status"> {
  status: LayoutResolution["status"] | "applied" | "blocked";
}
export interface LayoutController {
  inspect(): LayoutSnapshot;
  resolve(request: LayoutRequest): LayoutResolution;
  apply(request: LayoutRequest): Promise<LayoutResult>;
}
