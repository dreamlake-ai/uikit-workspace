import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
} from "@dreamlake/uikit";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="font-uikit-mono text-uikit-9 uppercase tracking-uikit-wide text-uikit-muted">
      {label}
    </span>
    <span className="border-b border-uikit-faint pb-1 text-uikit-13 text-uikit-ink">
      {value}
    </span>
  </div>
);

export const GrowingSpec = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError(false);
        }}
        title="Connect a Server"
        eyebrow="acme"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setError((e) => !e)}>Connect</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Server URL" value="https://api.example.com" />
          <Collapsible className="flex flex-col">
            <CollapsibleTrigger className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-uikit-12 text-uikit-muted hover:text-uikit-ink">
              <CollapsibleChevron />
              Connection options
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-4 pt-4">
              <Field label="Name" value="acme-lab" />
              <Field label="Namespace" value="default" />
            </CollapsibleContent>
          </Collapsible>
          {error && (
            <p className="m-0 text-uikit-12 text-uikit-danger">
              Could not reach the server. Check the URL and try again.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
};
