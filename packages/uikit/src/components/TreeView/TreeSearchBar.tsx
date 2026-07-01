import { CaseSensitive, Regex, Search } from "lucide-react";
import React from "react";

import { cn } from "../../lib/utils";
import { InputRoot, InputSlot } from "../Input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../Tooltip";

export type TreeSearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCaseSensitive: boolean;
  setIsCaseSensitive: (value: boolean | ((prev: boolean) => boolean)) => void;
  isRegex: boolean;
  setIsRegex: (value: boolean | ((prev: boolean) => boolean)) => void;
  isRegexValid: boolean;
  searchResultsCount: number;
  className?: string;
};

/** Search input for {@link TreeView}, with case-sensitive and regex toggles.
 *  Restyled to DreamLake; built on the kit's Input + Tooltip. */
export function TreeSearchBar({
  searchQuery,
  setSearchQuery,
  isCaseSensitive,
  setIsCaseSensitive,
  isRegex,
  setIsRegex,
  isRegexValid,
  searchResultsCount,
  className,
}: TreeSearchBarProps) {
  return (
    <div className={cn("shrink-0 font-uikit-ui", className)}>
      <InputRoot
        type="text"
        placeholder="Search..."
        size="sm"
        className="flex-1"
        inputClassName={cn(!isRegexValid && "text-uikit-tone-red")}
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchQuery(e.target.value)
        }
      >
        <InputSlot side="left">
          <Search className="text-uikit-muted size-4 stroke-1" />
        </InputSlot>
        <InputSlot side="right">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCaseSensitive((prev) => !prev)}
                  className={cn(
                    "rounded-uikit-badge mr-1 p-1",
                    isCaseSensitive ? "bg-uikit-ink-6" : "",
                  )}
                >
                  <CaseSensitive className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Case sensitive</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsRegex((prev) => !prev)}
                  className={cn(
                    "rounded-uikit-badge p-1",
                    isRegex && "bg-uikit-ink-6",
                  )}
                >
                  <Regex className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Use regular expression</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </InputSlot>
      </InputRoot>
      {searchQuery && isRegexValid && (
        <div className="flex justify-end px-2 pb-1">
          <span className="text-uikit-10 text-uikit-muted">
            {searchResultsCount} result{searchResultsCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
