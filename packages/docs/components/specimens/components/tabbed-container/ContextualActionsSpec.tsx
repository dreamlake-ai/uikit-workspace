import { Button, TabbedContainer } from "@dreamlake/uikit";

export function ContextualActionsSpec() {
  return (
    <TabbedContainer
      aria-label="Experiment views"
      actions={<Button variant="ghost" size="sm" children="Open memo" />}
      items={[
        {
          value: "overview",
          label: "Overview",
          children: <p>Question, primary chart and conclusion.</p>,
        },
        {
          value: "runs",
          label: "Runs 25",
          actions: (
            <Button variant="ghost" size="sm" children="Copy launch command" />
          ),
          children: <p>Plan versus actual, one row per config and seed.</p>,
        },
      ]}
    />
  );
}
