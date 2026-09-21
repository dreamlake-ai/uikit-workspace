import { type ComponentProps, Fragment, useMemo } from "react";
import { cn } from "../../lib/utils";

export interface HighlightedTextProps extends Omit<
  ComponentProps<"span">,
  "children"
> {
  /** The full string to render. */
  text: string;
  /** The substring to mark. Empty or absent → `text` renders untouched. */
  query: string;
  /** Match case. Off by default: a reader typing "lake" expects to see
   *  "Lakeshore" marked. */
  caseSensitive?: boolean;
  /** Classes on each `<mark>`, for a different wash in a dense list. */
  markClassName?: string;
}

/** Every index where `needle` starts inside `haystack`. */
function findRanges(haystack: string, needle: string, caseSensitive: boolean) {
  const source = caseSensitive ? haystack : haystack.toLowerCase();
  const target = caseSensitive ? needle : needle.toLowerCase();
  const out: number[] = [];
  let at = source.indexOf(target);
  while (at !== -1) {
    out.push(at);
    // Step by the match length: overlapping matches would double-mark the same
    // characters, and "aa" in "aaa" is one highlight to a reader, not two.
    at = source.indexOf(target, at + target.length);
  }
  return out;
}

/**
 * Renders `text` with every occurrence of `query` wrapped in a soft
 * accent-tinted `<mark>`. For search-result rows and result cards, where the
 * matched substring is what anchors the reader's eye.
 *
 * A real `<mark>`, not a tinted `<span>`: the element exists for exactly this,
 * and assistive tech can announce it. The browser's default yellow is
 * overridden by the kit's wash.
 *
 * Marks EVERY occurrence. The app's version marked only the first, which
 * mirrored a prototype rather than a decision — a reader who sees one instance
 * marked and an identical one two words later reads the second as "not a
 * match".
 */
export function HighlightedText({
  text,
  query,
  caseSensitive = false,
  className,
  markClassName,
  ...rest
}: HighlightedTextProps) {
  const q = (query ?? "").trim();
  const ranges = useMemo(
    () => (q ? findRanges(text ?? "", q, caseSensitive) : []),
    [text, q, caseSensitive],
  );

  if (ranges.length === 0) {
    return (
      <span className={className} {...rest}>
        {text}
      </span>
    );
  }

  const pieces: { text: string; marked: boolean }[] = [];
  let cursor = 0;
  for (const at of ranges) {
    if (at > cursor)
      pieces.push({ text: text.slice(cursor, at), marked: false });
    pieces.push({ text: text.slice(at, at + q.length), marked: true });
    cursor = at + q.length;
  }
  if (cursor < text.length)
    pieces.push({ text: text.slice(cursor), marked: false });

  return (
    <span className={className} {...rest}>
      {pieces.map((piece, i) =>
        piece.marked ? (
          <mark
            key={i}
            className={cn(
              "bg-uikit-accent-22 text-uikit-ink rounded-[3px] px-[2px]",
              markClassName,
            )}
          >
            {piece.text}
          </mark>
        ) : (
          <Fragment key={i}>{piece.text}</Fragment>
        ),
      )}
    </span>
  );
}
