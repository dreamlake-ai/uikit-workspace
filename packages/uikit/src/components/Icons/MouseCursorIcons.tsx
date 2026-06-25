export interface MouseCursorIconProps {
  strokeWidth?: number
}

const PATH =
  'M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z'

/** Outline mouse-pointer icon. Inherits `currentColor`. Ported verbatim from
 *  the legacy `@vuer-ai/vuer-uikit`. */
export function MouseCursorIcon({ strokeWidth = 2.25 }: MouseCursorIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATH} />
    </svg>
  )
}

/** Filled variant of {@link MouseCursorIcon}. */
export function MouseCursorAltIcon({ strokeWidth = 2.25 }: MouseCursorIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={strokeWidth / 2}
    >
      <path d={PATH} />
    </svg>
  )
}
