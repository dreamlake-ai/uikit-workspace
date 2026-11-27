import { createContext, useContext, useId } from "react";
import type {
  CSSProperties,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
  SVGProps,
} from "react";
import { Pin } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleChevron,
} from "../Collapsible/Collapsible";
import { TruncatedText } from "./TruncatedText";
import "./CollectionList.css";

const CollectionColumns = createContext(1);
const CollectionGrid = createContext<boolean | null>(null);
/** Share an explicit column count across collection groups without resizing their panel. */
export const CollectionLayoutProvider = CollectionColumns.Provider;
export const useCollectionColumns = () => useContext(CollectionColumns);

/** Data, ordering, navigation and mutations belong to the caller.
 * `columns` stays exact even in narrow panels. Mark section headers/status with
 * data-collection-span to span the grid. `grid` retains tile previews when an
 * adaptive layout fits only one column. Rows remain mounted when switching. */
export function CollectionList({
  children,
  className = "",
  columns: explicitColumns,
  grid: explicitGrid,
  style,
  onKeyDown,
  ...props
}: ComponentProps<"div"> & { columns?: number; grid?: boolean }) {
  const inherited = useCollectionColumns();
  const columns = Math.max(1, Math.floor(explicitColumns ?? inherited));
  const grid = explicitGrid ?? columns > 1;
  return (
    <CollectionLayoutProvider value={columns}>
      <CollectionGrid.Provider value={grid}>
        <div
          {...props}
          className={`uikit-collection-list ${className}`}
          data-columns={grid ? columns : undefined}
          style={
            {
              ...style,
              ...(grid
                ? {
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }
                : {}),
            } as CSSProperties
          }
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              event.defaultPrevented ||
              !grid ||
              event.shiftKey ||
              event.metaKey ||
              event.ctrlKey ||
              event.altKey
            )
              return;
            if (
              !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            )
              return;
            const target = event.target as HTMLElement;
            if (!target.matches("[data-collection-item]")) return;
            const origin = target.getBoundingClientRect();
            const horizontal =
              event.key === "ArrowLeft" || event.key === "ArrowRight";
            const sign =
              event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
            const center = (r: DOMRect) => [
              r.x + r.width / 2,
              r.y + r.height / 2,
            ];
            const start = center(origin);
            const candidates = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                "[data-collection-item]",
              ),
            )
              .filter(
                (row) =>
                  row !== target &&
                  !row.closest("[inert]") &&
                  row.getClientRects().length,
              )
              .map((row) => {
                const c = center(row.getBoundingClientRect());
                const forward =
                  (c[horizontal ? 0 : 1] - start[horizontal ? 0 : 1]) * sign;
                const cross = Math.abs(
                  c[horizontal ? 1 : 0] - start[horizontal ? 1 : 0],
                );
                return { row, forward, score: forward + cross * 4 };
              })
              .filter(({ forward }) => forward > 1)
              .sort((a, b) => a.score - b.score);
            event.preventDefault();
            event.stopPropagation();
            candidates[0]?.row.focus({ preventScroll: true });
            candidates[0]?.row.scrollIntoView?.({ block: "nearest" });
          }}
        >
          {children}
        </div>
      </CollectionGrid.Provider>
    </CollectionLayoutProvider>
  );
}

export interface CollectionRowBodyProps {
  classNames?: Partial<
    Record<
      | "title"
      | "line"
      | "icon"
      | "name"
      | "detail"
      | "end"
      | "meta"
      | "actions",
      string
    >
  >;
  icon: ReactNode;
  /** Keep an icon control accessible and independent of row navigation. */
  iconInteractive?: boolean;
  /** Optional preview used only in the compact grid presentation. */
  thumbnail?: ReactNode;
  name: ReactNode;
  nameId?: string;
  nameText?: string;
  prefix?: ReactNode;
  badge?: ReactNode;
  location?: ReactNode;
  meta?: ReactNode;
  detail?: ReactNode;
  actions?: ReactNode;
  pinned?: boolean;
  fillName?: boolean;
}

/** Same slots for folder nodes, Bindr members, project links and other inventories.
 * Actions have their own hit targets and never activate the containing row. */
export function CollectionRowBody({
  classNames = {},
  icon,
  iconInteractive,
  thumbnail,
  name,
  nameId,
  nameText,
  prefix,
  badge,
  location,
  meta,
  detail,
  actions,
  pinned,
  fillName,
}: CollectionRowBodyProps) {
  const columns = useCollectionColumns();
  const tile = useContext(CollectionGrid) ?? columns > 1;
  return (
    <>
      <span
        className={`uikit-collection-line ${classNames.line ?? ""}`}
        data-presentation={tile ? "tile" : undefined}
      >
        <span
          className={`uikit-collection-icon ${classNames.icon ?? ""}`}
          data-pinned={pinned || undefined}
          aria-hidden={pinned || iconInteractive ? undefined : true}
          onClick={
            iconInteractive ? (event) => event.stopPropagation() : undefined
          }
          onKeyDown={
            iconInteractive ? (event) => event.stopPropagation() : undefined
          }
        >
          {tile && thumbnail ? (
            thumbnail
          ) : pinned ? (
            <span
              className="uikit-collection-type-icon"
              aria-hidden={iconInteractive ? undefined : true}
            >
              {icon}
            </span>
          ) : (
            icon
          )}
          {pinned && (
            <span
              className="uikit-collection-pin"
              role="img"
              aria-label="Pinned in this collection"
            >
              <Pin size={12} aria-hidden />
            </span>
          )}
        </span>
        {prefix && <span className="uikit-collection-prefix">{prefix}</span>}
        <span
          className={`uikit-collection-title ${classNames.title ?? ""}`}
          style={fillName ? { flex: "1 1 0%" } : undefined}
        >
          <TruncatedText
            id={nameId}
            text={nameText}
            className={`uikit-collection-name ${classNames.name ?? ""}`}
          >
            {name}
          </TruncatedText>
          {location && (
            <span className="uikit-collection-location">{location}</span>
          )}
        </span>
        {badge && <span className="uikit-collection-badge">{badge}</span>}
        {(meta || actions) && (
          <span className={`uikit-collection-end ${classNames.end ?? ""}`}>
            {meta && (
              <span
                className={`uikit-collection-meta ${classNames.meta ?? ""}`}
              >
                {meta}
              </span>
            )}
            {actions && (
              <span
                className={`uikit-collection-actions ${classNames.actions ?? ""}`}
                onClickCapture={(event) => event.preventDefault()}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {actions}
              </span>
            )}
          </span>
        )}
      </span>
      {detail && (
        <span className={`uikit-collection-detail ${classNames.detail ?? ""}`}>
          {detail}
        </span>
      )}
    </>
  );
}

export function CollectionRow({
  classNames,
  icon,
  iconInteractive,
  thumbnail,
  name,
  nameId,
  nameText,
  prefix,
  badge,
  location,
  meta,
  detail,
  actions,
  pinned,
  fillName,
  className = "",
  children,
  ...props
}: CollectionRowBodyProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-collection-item=""
      {...props}
      className={`uikit-collection-row ${className}`}
    >
      <CollectionRowBody
        {...{
          classNames,
          icon,
          iconInteractive,
          thumbnail,
          name,
          nameId,
          nameText,
          prefix,
          badge,
          location,
          meta,
          detail,
          actions,
          pinned,
          fillName,
        }}
      />
      {children}
    </div>
  );
}

/** A neutral Lucide-derived pin above three translucent perspective sheets. */
export function PinnedPlaneIcon({
  className = "",
  ...props
}: SVGProps<SVGSVGElement>) {
  const glassId = useId();
  return (
    <svg
      className={`uikit-pinned-plane ${className}`}
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={glassId} x1="0" y1="0" x2="0.35" y2="1">
          <stop stopColor="var(--bg, #fff)" stopOpacity={0.78} />
          <stop offset="0.5" stopColor="currentColor" stopOpacity={0.1} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0.26} />
        </linearGradient>
      </defs>
      <g
        className="uikit-pinned-paper uikit-pinned-paper-back"
        fill={`url(#${glassId})`}
      >
        <path d="M13 13.4Q14 12.9 15 13.4L24 18Q25.4 18.7 24 19.4L15 24Q14 24.5 13 24L4 19.4Q2.6 18.7 4 18Z" />
      </g>
      <g
        className="uikit-pinned-paper uikit-pinned-paper-middle"
        fill={`url(#${glassId})`}
      >
        <path d="M13 13.4Q14 12.9 15 13.4L24 18Q25.4 18.7 24 19.4L15 24Q14 24.5 13 24L4 19.4Q2.6 18.7 4 18Z" />
      </g>
      <g
        className="uikit-pinned-paper uikit-pinned-paper-front"
        fill={`url(#${glassId})`}
      >
        <path d="M13 13.4Q14 12.9 15 13.4L24 18Q25.4 18.7 24 19.4L15 24Q14 24.5 13 24L4 19.4Q2.6 18.7 4 18Z" />
      </g>
      <g className="uikit-pinned-plane-pin">
        <path d="M11 3h6" />
        <path
          d="M12 3v4l-2 4h8l-2-4V3Z"
          fill="currentColor"
          fillOpacity={0.2}
        />
        <path d="M14 11v5" />
      </g>
    </svg>
  );
}

export interface PinnedCollectionDrawerProps {
  children: ReactNode;
  /** Loaded pinned rows; omit when the total is not known. */
  count?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Place before the collection's ordinary rows; render each item only once.
 * The host keeps filtering, pagination and selection in the collection's scope. */
export function PinnedCollectionDrawer({
  children,
  count,
  open,
  defaultOpen = true,
  onOpenChange,
}: PinnedCollectionDrawerProps) {
  const countId = useId();
  return (
    <Collapsible
      className="uikit-pinned-drawer"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger
        className="uikit-pinned-drawer-trigger"
        aria-label="Pinned"
        aria-describedby={count !== undefined ? countId : undefined}
        data-list-row="pinned"
      >
        <PinnedPlaneIcon />
        <span className="uikit-pinned-drawer-label">Pinned</span>
        {count !== undefined && (
          <span
            id={countId}
            className="uikit-pinned-drawer-count"
            aria-label={`${count} pinned ${count === 1 ? "item" : "items"} shown`}
          >
            {count}
          </span>
        )}
        <CollapsibleChevron />
      </CollapsibleTrigger>
      <CollapsibleContent role="group" aria-label="Pinned items">
        <CollectionList>{children}</CollectionList>
      </CollapsibleContent>
    </Collapsible>
  );
}
