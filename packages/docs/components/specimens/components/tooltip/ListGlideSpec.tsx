import { useRef, useState } from "react";
import { Tooltip, TooltipContent } from "@dreamlake/uikit";

const ROWS = [
  "camera/front",
  "camera/wrist",
  "lidar/top",
  "imu/base",
  "joint_states",
];

/**
 * One shared popover for a whole list. It anchors to the list's right edge at
 * the hovered row's centre and glides between rows; its content stays mounted.
 */
export const ListGlideSpec = () => {
  const listRef = useRef<HTMLUListElement>(null);
  const rowRef = useRef<HTMLElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const closeTimer = useRef<number>(0);

  const show = (name: string, el: HTMLElement) => {
    window.clearTimeout(closeTimer.current);
    rowRef.current = el;
    setHovered(name);
  };
  const hide = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHovered(null), 80);
  };
  const anchor = () => {
    const list = listRef.current!.getBoundingClientRect();
    const row = rowRef.current?.getBoundingClientRect() ?? list;
    const y = row.top + row.height / 2;
    return new DOMRect(list.right, y, 0, 0);
  };

  return (
    <>
      <ul
        ref={listRef}
        onMouseLeave={hide}
        style={{ width: 220, margin: 0, padding: 0, listStyle: "none" }}
      >
        {ROWS.map((name) => (
          <li key={name}>
            <button
              type="button"
              onMouseEnter={(e) => show(name, e.currentTarget)}
              onFocus={(e) => show(name, e.currentTarget)}
              onBlur={hide}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "block",
                width: "100%",
                padding: "4px 8px",
                cursor: "default",
                fontFamily: "var(--font-uikit-mono)",
                fontSize: 12,
                background: hovered === name ? "var(--row-hover)" : undefined,
              }}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
      <Tooltip
        open={hovered !== null}
        onOpenChange={(open) => !open && setHovered(null)}
        anchorRect={anchor}
        glide
        side="right"
        sideOffset={4}
      >
        <TooltipContent>{hovered}</TooltipContent>
      </Tooltip>
    </>
  );
};
