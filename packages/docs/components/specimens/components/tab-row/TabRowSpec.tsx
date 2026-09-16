import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Slider, TabRow } from "@dreamlake/uikit";

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
    { value: "hosts", label: "Enroll hosts through SSH" },
    { value: "test", label: "Test host enrollment" },
    { value: "release", label: "Release checklist" },
  ]);
  const [value, setValue] = useState("plan");
  const [minimum, setMinimum] = useState(80);
  const [preferred, setPreferred] = useState(170);
  const [width, setWidth] = useState(560);

  return (
    <div className="w-full min-w-0">
      <div className="mb-8 flex flex-wrap gap-x-6 gap-y-5">
        <Knob
          label="Row width"
          value={width}
          min={220}
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

      <div className="max-w-full" style={{ width }}>
        <TabRow
          tabs={tabs}
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
              className="size-6 rounded-uikit-badge"
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
          onClose={(id) => {
            const remaining = tabs.filter((t) => t.value !== id);
            setTabs(remaining);
            if (value === id) setValue(remaining[0]?.value ?? "");
          }}
        />
        <p className="mt-4 text-sm text-uikit-muted">
          Selected:{" "}
          <code className="font-uikit-mono">
            {tabs.find((t) => t.value === value)?.label ?? "No documents"}
          </code>
        </p>
      </div>
    </div>
  );
}
