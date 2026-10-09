import { ChevronUp } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@dreamlake/uikit";

/** The wedge moves to the opposite edge when available viewport space flips the panel. */
export const ArrowSpec = () => (
  <DropdownMenu arrow side="top">
    <DropdownMenuTrigger asChild>
      <Button size="sm" variant="ghost">
        View <ChevronUp size={12} aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Machines</DropdownMenuItem>
      <DropdownMenuItem>Cluster overview</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
