import { useState } from "react";
import { Checkbox } from "@dreamlake/uikit";

export function CheckboxSpec() {
  const [checked, setChecked] = useState(true);
  const [mixed, setMixed] = useState(true);
  return (
    <div
      role="group"
      aria-label="Checkbox examples"
      className="flex flex-col gap-3 text-uikit-12 text-uikit-ink"
    >
      <label className="inline-flex min-h-6 cursor-pointer items-center gap-2">
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        Show curves
      </label>
      <label className="inline-flex min-h-6 cursor-pointer items-center gap-2">
        <Checkbox defaultChecked={false} name="showLabels" value="visible" />
        Show labels
      </label>
      <label className="inline-flex min-h-6 cursor-pointer items-center gap-2">
        <Checkbox
          indeterminate={mixed}
          onCheckedChange={() => setMixed(false)}
        />
        Mixed selection
      </label>
      <label className="inline-flex min-h-6 items-center gap-2 opacity-50">
        <Checkbox disabled defaultChecked />
        Disabled choice
      </label>
      <output aria-live="polite">Curves {checked ? "shown" : "hidden"}</output>
    </div>
  );
}
