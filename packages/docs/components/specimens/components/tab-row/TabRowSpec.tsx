import { useState } from "react";
import { Ellipsis, FileText, Plus, X } from "lucide-react";
import {
  AdaptiveTabLabel,
  Button,
  DocumentTabHeading,
  Slider,
  TabRow,
} from "@dreamlake/uikit";

/**
 * A demo knob: token-styled caption over a uikit Slider. Kept local to the
 * specimen — it exists to drive the TabRow below, not as a kit component.
 */
function Knob({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 basis-24 flex-col gap-2">
      <span className="font-uikit-mono text-[9px] font-medium tracking-uikit-wide uppercase text-uikit-muted">
        {label} <span className="normal-case text-uikit-ink">{value}px</span>
      </span>
      <Slider
        role="group"
        aria-label={label}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={min}
        max={max}
      />
    </div>
  );
}

export function TabRowSpec() {
  const [tabs, setTabs] = useState([
    { value: "plan", label: "Detailed Implementation Plan" },
    { value: "hosts", label: "geyang@training-host" },
    { value: "test", label: "Test host enrollment" },
    { value: "release", label: "Release checklist" },
  ]);
  const [value, setValue] = useState("plan");
  const close = (id: string) => {
    const remaining = tabs.filter((tab) => tab.value !== id);
    setTabs(remaining);
    if (value === id) setValue(remaining[0]?.value ?? "");
  };
  const [minimum, setMinimum] = useState(80);
  const [preferred, setPreferred] = useState(170);
  const [width, setWidth] = useState(560);
  const [startEdge, setStartEdge] = useState<"curved" | "flush">("curved");

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex items-stretch bg-uikit-workspace pt-0.5">
        <DocumentTabHeading>
          <nav aria-label="Project breadcrumb">
            <a href="#projects">Projects</a> / Example
          </nav>
        </DocumentTabHeading>
        <Button className="ml-auto" variant="action" size="sm">
          Refresh
        </Button>
      </div>
      <div className="mb-8 flex flex-wrap gap-x-6 gap-y-5">
        <Knob
          label="Row width"
          value={width}
          min={120}
          max={800}
          onChange={setWidth}
        />
        <Knob
          label="Minimum"
          value={minimum}
          min={48}
          max={140}
          onChange={setMinimum}
        />
        <Knob
          label="Preferred"
          value={preferred}
          min={140}
          max={260}
          onChange={setPreferred}
        />
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm">
        Left neighbor
        <select
          aria-label="Left neighbor"
          value={startEdge}
          onChange={(event) =>
            setStartEdge(event.target.value as "curved" | "flush")
          }
        >
          <option value="curved">White panel — curved foot</option>
          <option value="flush">Background panel — flush edge</option>
        </select>
      </label>
      <div
        className="min-w-0 max-w-full overflow-hidden bg-uikit-workspace"
        style={{ width }}
        data-tab-row-example="compression"
      >
        <TabRow
          tabs={tabs.map((tab) => ({
            ...tab,
            labelContent:
              tab.value === "hosts" ? (
                <AdaptiveTabLabel
                  label={tab.label}
                  alternatives={["g@training-host", "training-host"]}
                />
              ) : undefined,
            icon: tab.value === "hosts" ? <FileText size={12} /> : undefined,
            closeButton: tabs.length > 1,
          }))}
          startEdge={startEdge}
          value={value}
          onValueChange={setValue}
          minTabWidth={minimum}
          preferredTabWidth={preferred}
          aria-label="Example documents"
          leading={
            <Button
              variant="ghost"
              icon
              size="sm"
              // The row has its own radius vocabulary — 8px tabs, 4px close
              // buttons. Button's default 10px reads rounder than either on a
              // square, so the hover fill sits at the kit's small-control 6px.
              className="uikit-document-tab-action"
              aria-label="New document"
              onClick={() => {
                const id = crypto.randomUUID();
                setTabs([...tabs, { value: id, label: "Untitled document" }]);
                setValue(id);
              }}
            >
              <Plus size={14} />
            </Button>
          }
          trailing={
            <>
              <Button
                icon
                variant="ghost"
                size="sm"
                className="uikit-document-tab-action"
                aria-label="Document options"
              >
                <Ellipsis size={14} />
              </Button>
              {tabs.length === 1 && (
                <Button
                  icon
                  variant="ghost"
                  size="sm"
                  className="uikit-document-tab-action"
                  aria-label="Close panel"
                  onClick={() => close(tabs[0].value)}
                >
                  <X size={14} />
                </Button>
              )}
            </>
          }
          onClose={close}
        />
        <div
          data-tab-row-body=""
          className="bg-uikit-bg p-4 text-sm text-uikit-muted"
        >
          Only the tab strip scrolls; this content stays fixed. Selected:{" "}
          <code className="font-uikit-mono">
            {tabs.find((t) => t.value === value)?.label ?? "No documents"}
          </code>
        </div>
      </div>
    </div>
  );
}
