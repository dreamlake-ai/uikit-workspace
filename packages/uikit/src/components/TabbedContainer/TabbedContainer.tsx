import { useId, useRef, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "../Tabs";
import { cn } from "../../lib/utils";

export interface TabbedContainerItem {
  value: string;
  label: ReactNode;
  children: ReactNode;
}
export interface TabbedContainerProps {
  items: TabbedContainerItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label": string;
  /** Preserve inactive contents and their local state. Hidden panels are inert. */
  keepMounted?: boolean;
  className?: string;
  contentClassName?: string;
}
/** A neutral, framed tabbed content surface, following Dockit's CodeTabs file-tab
 * geometry. It accepts arbitrary content; CodeBlock/editor concerns stay outside.
 */
export function TabbedContainer({
  items,
  value,
  defaultValue,
  onValueChange,
  "aria-label": label,
  keepMounted = true,
  className,
  contentClassName,
}: TabbedContainerProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const id = useId(),
    buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = value ?? internal;
  const active = items.findIndex((item) => item.value === selected);
  const index = active < 0 ? 0 : active;
  const choose = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  if (!items.length) return null;
  return (
    <div
      className={cn("uikit-tabbed-container", className)}
      data-first-active={index === 0}
    >
      <Tabs value={items[index].value} onValueChange={choose}>
        <div className="uikit-tabbed-container-header">
          <TabsList aria-label={label} className="uikit-tabbed-container-tabs">
            {items.map((item, i) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                ref={(node) => {
                  buttons.current[i] = node;
                }}
                id={`${id}-tab-${i}`}
                aria-controls={`${id}-panel-${i}`}
                tabIndex={index === i ? 0 : -1}
                onKeyDown={(event) => {
                  let next: number;
                  if (event.key === "ArrowRight") next = (i + 1) % items.length;
                  else if (event.key === "ArrowLeft")
                    next = (i + items.length - 1) % items.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = items.length - 1;
                  else return;
                  event.preventDefault();
                  choose(items[next].value);
                  buttons.current[next]?.focus();
                }}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {items.map(
          (item, i) =>
            (keepMounted || index === i) && (
              <div
                key={item.value}
                role="tabpanel"
                id={`${id}-panel-${i}`}
                aria-labelledby={`${id}-tab-${i}`}
                hidden={index !== i}
                inert={index !== i}
                tabIndex={0}
                className={cn(
                  "uikit-tabbed-container-content",
                  contentClassName,
                )}
              >
                {item.children}
              </div>
            ),
        )}
      </Tabs>
    </div>
  );
}
