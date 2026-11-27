import { ProgressRail } from "@dreamlake/uikit";

export function Demo() {
  return (
    <section
      aria-label="Progress rail example"
      className="flex flex-wrap gap-10 p-4"
    >
      <div className="w-[140px]">
        <h3 className="mb-4 text-uikit-13 font-medium">Evaluation stages</h3>
        <ProgressRail
          aria-label="Evaluation progress"
          items={[
            {
              id: "matched",
              label: "Matched",
              detail: "19:39:18",
              state: "complete",
            },
            {
              id: "queued",
              label: "Waiting for a runner",
              detail: "19:39:18",
              state: "complete",
            },
            {
              id: "running",
              label: "Running",
              detail: "3 trials reporting",
              state: "current",
            },
            { id: "collected", label: "Evidence collected", state: "pending" },
          ]}
        />
      </div>
      <div className="w-[140px]">
        <h3 className="mb-4 text-uikit-13 font-medium">Collection error</h3>
        <ProgressRail
          aria-label="Collection progress"
          items={[
            { id: "finished", label: "Job finished", state: "complete" },
            {
              id: "collected",
              label: "Evidence collection needs authorization",
              detail: "Authorize the output destination before retrying.",
              state: "error",
            },
          ]}
        />
      </div>
    </section>
  );
}
