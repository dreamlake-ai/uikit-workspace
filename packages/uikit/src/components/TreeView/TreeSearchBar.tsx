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
        {/* Flex, so the slot is exactly as tall as the buttons in it. As a
            block it was a line box — 22px for 18px buttons, with the extra
            leading landing under them, which left the hover fill 1px from the
            field's top edge and 5px from its bottom. */}
        <InputSlot side="right" className="flex items-center">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCaseSensitive((prev) => !prev)}
                  className={cn(
                    // Hover darkens the glyph; it does not paint a box. The
                    // slot's icons rest at `--uikit-muted`, so going to
                    // `--ink` is the same move the rest of the kit makes for
                    // "the pointer is on this" — and inside a 24px field a
                    // fill had nowhere to go without reading as the field
                    // itself changing.
                    //
                    // The ACTIVE fill stays. Hover is transient and the
                    // pointer is on it; on/off has to survive the pointer
                    // leaving, which colour alone cannot do here because
                    // hover already uses it.
                    "rounded-uikit-badge mr-1 px-1 py-px transition-colors hover:text-uikit-ink",
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
                    "rounded-uikit-badge px-1 py-px transition-colors hover:text-uikit-ink",
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
