import { useState } from "react";
import {
  Button,
  StatusStackIcon,
  type StatusStackCounts,
} from "@dreamlake/uikit";
const examples: {
  label: string;
  counts: StatusStackCounts;
  complete: boolean;
}[] = [
  {
    label: "All passed",
    counts: { passed: 12, failed: 0, other: 0 },
    complete: true,
  },
  {
    label: "Mixed outcomes",
    counts: { passed: 7, failed: 2, other: 3 },
    complete: true,
  },
  {
    label: "Failures and passes",
    counts: { passed: 8, failed: 2, other: 0 },
    complete: true,
  },
  {
    label: "Other outcomes",
    counts: { passed: 0, failed: 0, other: 4 },
    complete: true,
  },
  {
    label: "Incomplete inventory",
    counts: { passed: 5, failed: 0, other: 0 },
    complete: false,
  },
  {
    label: "Empty inventory",
    counts: { passed: 0, failed: 0, other: 0 },
    complete: true,
  },
];
export function Demo() {
  const [complete, setComplete] = useState(false);
  return (
    <section aria-label="Status stack example" className="space-y-4 p-4">
      <ul className="space-y-3">
        {examples.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <StatusStackIcon {...item} />
            <span className="text-uikit-12">{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <StatusStackIcon
          label="Interactive group"
          counts={{ passed: 3, failed: 0, other: 0 }}
          complete={complete}
        />
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={complete}
          onClick={() => setComplete(!complete)}
        >
          Inventory complete
        </Button>
      </div>
    </section>
  );
}
