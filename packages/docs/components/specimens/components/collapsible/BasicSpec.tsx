import type { ReactNode } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@dreamlake/uikit";
import { ChevronsUpDown } from "lucide-react";

const Row = ({ children }: { children: ReactNode }) => (
  <div className="rounded-[var(--radius)] border border-uikit-faint px-3 py-2 text-uikit-12 text-uikit-ink">
    {children}
  </div>
);

export const BasicSpec = () => (
  <Collapsible defaultOpen className="flex w-80 flex-col gap-2">
    <div className="flex items-center justify-between gap-4 px-1">
      <h4 className="text-uikit-13 font-semibold text-uikit-ink">
        @peduarte starred 3 repositories
      </h4>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" icon size="md" title="Toggle">
          <ChevronsUpDown className="size-4" />
        </Button>
      </CollapsibleTrigger>
    </div>

    <Row>@radix-ui/primitives</Row>

    <CollapsibleContent className="flex flex-col gap-2 pt-2">
      <Row>@radix-ui/colors</Row>
      <Row>@stitches/react</Row>
    </CollapsibleContent>
  </Collapsible>
);
