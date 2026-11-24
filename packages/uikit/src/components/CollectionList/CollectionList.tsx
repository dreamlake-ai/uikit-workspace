import type { HTMLAttributes, ReactNode } from "react";
import { Pin } from "lucide-react";
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
