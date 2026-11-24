import { useId } from "react";
import type { HTMLAttributes, ReactNode, SVGProps } from "react";
import { Pin } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleChevron,
} from "../Collapsible/Collapsible";
import { TruncatedText } from "./TruncatedText";
import "./CollectionList.css";

/** Shared list geometry. Data, ordering, navigation and mutations belong to the caller.
 * For large inventories, render these rows through VirtualListFlow. */
export function CollectionList({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`uikit-collection-list ${className}`}>
      {children}
    </div>
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
  return (
    <>
      <span className={`uikit-collection-line ${classNames.line ?? ""}`}>
        <span
          className={`uikit-collection-icon ${classNames.icon ?? ""}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        {prefix}
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
          {location}
        </span>
        {pinned && (
          <span
            className="uikit-collection-pin"
            role="img"
            aria-label="Pinned in this collection"
          >
            <Pin size={12} aria-hidden />
          </span>
        )}
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
    <div {...props} className={`uikit-collection-row ${className}`}>
      <CollectionRowBody
        {...{
          classNames,
          icon,
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

/** A neutral Lucide-derived pin above three animated perspective sheets. */
export function PinnedPlaneIcon({
  className = "",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`uikit-pinned-plane ${className}`}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <g className="uikit-pinned-paper uikit-pinned-paper-back" opacity={0.4}>
        <path
          d="m12 11.5 9 4.5-9 4.5-9-4.5Z"
          fill="currentColor"
          fillOpacity={0.08}
        />
      </g>
      <g className="uikit-pinned-paper uikit-pinned-paper-middle" opacity={0.6}>
        <path
          d="m12 11.5 9 4.5-9 4.5-9-4.5Z"
          fill="currentColor"
          fillOpacity={0.1}
        />
      </g>
      <g className="uikit-pinned-paper uikit-pinned-paper-front">
        <path
          d="m12 11.5 9 4.5-9 4.5-9-4.5Z"
          fill="currentColor"
          fillOpacity={0.14}
        />
      </g>
      <g className="uikit-pinned-plane-pin">
        <path d="M8.5 2.5h7" />
        <path
          d="M10 2.5V7l-2.5 4.5h9L14 7V2.5Z"
          fill="currentColor"
          fillOpacity={0.2}
        />
        <path d="M12 11.5v6" />
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
