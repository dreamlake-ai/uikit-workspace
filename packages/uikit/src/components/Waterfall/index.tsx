import { type ReactNode, useEffect, useState } from "react";

import { cn } from "../../lib/utils";
import { TooltipProvider } from "../Tooltip";
import { CursorOverlay } from "./CursorOverlay";
import { useTimelineState } from "./hooks/useTimelineState";
import { useViewport } from "./hooks/useViewport";
import { NavigationControls } from "./NavigationControls";
import { Tick } from "./Tick";
import { TimelineEvent } from "./TimelineEvent";
import { TimelineProcessBar } from "./TimelineProcessBar";
import { TimeRuleEventDot } from "./TimeRuleEventDot";
import { type LogItemType, type LogItemWithMeta } from "./types";
import { leftWedgeClasses, rightWedgeClasses, TOTAL_DURATION } from "./utils";
import { LeftWedge, RightWedge } from "./Wedges";
import { WheelZoomContext } from "./WheelZoomContext";
import {
  SyncDragY,
  SyncScroll,
  SyncScrollProvider,
  SyncScrollSlave,
} from "../SyncScroll";
import {
  TreeSearchBar,
  TreeView,
  useTreeSearch,
  useTreeState,
} from "../TreeView";

export * from "./types";
export * from "./utils";

export interface WaterfallProps {
  logData: LogItemType[];
  temporalCursor?: number;
  /** Width of the list view */
  panelWidth?: number;
  onTemporalCursorChange?: (time: number) => void;
  getIcon: (item: LogItemType) => ReactNode;
  /** External hover state (optional - will use internal state if not provided) */
  hoveredId?: string | null;
  /** External hover setter (optional - will use internal state if not provided) */
  onItemHover?: (id: string | null) => void;
  /** Minimum zoom viewWindow duration in seconds (default: 0.01) */
  minWindow?: number;
  /** Maximum zoom viewWindow duration in seconds (default: event duration * 10) */
  maxWindow?: number;
  /** Zoom factor for mouse wheel zoom (default: 1.1) */
  zoomFactor?: number;
  /** Enable wheel handling for pan and zoom (default: true) */
  enabled?: boolean;
  /** Children elements to render within the timeline */
  children?: ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * Timeline waterfall — a list/tree of events on the left, a zoomable, pannable
 * time axis on the right. Manages its own viewport, search, and expansion state.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Waterfall; restyled to DreamLake
 * panel/tone tokens.
 */
export function Waterfall({
  logData,
  temporalCursor,
  onTemporalCursorChange,
  getIcon,
  panelWidth = 300,
  className,
  hoveredId: externalHoveredId,
  onItemHover: externalOnItemHover,
  minWindow = 0.01,
  maxWindow,
  zoomFactor = 1.1,
  enabled = true,
  children,
}: WaterfallProps) {
  const [visibleLogData, setVisibleLogData] = useState<LogItemWithMeta[]>([]);
  const [temporalMarkers, setTemporalMarkers] = useState<number[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  // Use external state if provided, otherwise use internal state
  const internalTimelineState = useTimelineState(logData);

  const hoveredId = externalHoveredId ?? internalTimelineState.hoveredId;
  const setHoveredId =
    externalOnItemHover ?? internalTimelineState.setHoveredId;

  // Use the tree hooks for visibility/expansion + search
  const {
    visibleData,
    expandedItems,
    toggleItem,
    hasDescendants,
    dataWithMeta,
  } = useTreeState({
    data: logData,
    defaultExpanded: true,
  });

  const {
    filteredData,
    searchResultsCount,
    isRegexValid,
    renderLabel,
    hasActiveSearch,
  } = useTreeSearch({
    data: logData,
    searchQuery,
    isCaseSensitive,
    isRegex,
  });

  // Update visible log data when filtered data changes
  useEffect(() => {
    // If there's an active search, use filtered data, otherwise use visible data
    const dataToUse = hasActiveSearch
      ? dataWithMeta.filter((item) =>
          filteredData.some((f) => f.id === item.id),
        )
      : visibleData;
    setVisibleLogData(dataToUse as LogItemWithMeta[]);
  }, [filteredData, visibleData, dataWithMeta, hasActiveSearch]);

  const {
    viewStart,
    viewDuration,
    timelineContainerRef,
    timeToPercent,
    ticks,
    eventDots,
    handlePan,
    handleZoomDragStart,
    setViewStart,
    setViewDuration,
    cursorVisible,
    cursorPosition,
    cursorLabel,
    showMagnet,
  } = useViewport({
    visibleLogData,
    onTemporalCursorChange,
    temporalCursor,
  });

  return (
    <TooltipProvider>
      <SyncScrollProvider>
        <div
          className={cn(
            "bg-uikit-panel text-uikit-ink rounded-[var(--radius)] mx-auto flex w-full flex-col overflow-hidden font-uikit-ui shadow-uikit-soft",
            className,
          )}
        >
          {/* Header Section with Search and Timeline Ruler */}
          <div className="relative flex h-full flex-row items-stretch">
            {/* Search Bar and Tree View */}
            <div
              className="border-uikit-faint/50 relative flex h-full flex-none flex-col border-r"
              style={{ width: panelWidth }}
            >
              <TreeSearchBar
                className="p-1"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isCaseSensitive={isCaseSensitive}
                setIsCaseSensitive={setIsCaseSensitive}
                isRegex={isRegex}
                setIsRegex={setIsRegex}
                isRegexValid={isRegexValid}
                searchResultsCount={searchResultsCount}
              />
              <SyncScroll className="flex-1 overflow-y-auto">
                <TreeView
                  data={
                    hasActiveSearch
                      ? dataWithMeta.filter((item) =>
                          filteredData.some((f) => f.id === item.id),
                        )
                      : visibleData
                  }
                  getIcon={getIcon}
                  expandedItems={expandedItems}
                  onToggleItem={toggleItem}
                  onItemHover={setHoveredId}
                  hoveredId={hoveredId}
                  hasDescendants={hasDescendants}
                  renderLabel={renderLabel}
                />
              </SyncScroll>
            </div>
            <div
              ref={timelineContainerRef}
              className="overflow-y-none scrollbar-hide relative flex h-full w-full flex-auto cursor-crosshair flex-col overflow-x-hidden pl-px active:cursor-grabbing"
            >
              {/* Timeline Ruler */}
              <div className="sticky top-0">
                <div className="border-uikit-faint/50 relative h-8 border-b">
                  {/* Timeline markers */}
                  {ticks.map((marker, ind) => (
                    <Tick
                      key={marker.time}
                      time={marker.time}
                      label={marker.label}
                      timeToPercent={timeToPercent}
                      zIndex={ind < ticks.length - 1 ? 10 : 0}
                    />
                  ))}
                  {/* Key event dots */}
                  {eventDots.map(({ time }, tickIndex) => (
                    <TimeRuleEventDot
                      key={`snap-${time}-${tickIndex}`}
                      percent={timeToPercent(time)}
                    />
                  ))}
                </div>
              </div>
              {/* Timeline Content */}
              <WheelZoomContext
                className="scrollbar-hide relative h-full max-h-full overflow-auto"
                viewStart={viewStart}
                viewDuration={viewDuration}
                onViewStartChange={setViewStart}
                onWindowChange={setViewDuration}
                minWindow={minWindow}
                maxWindow={maxWindow ?? TOTAL_DURATION * 10}
                zoomFactor={zoomFactor}
                enabled={enabled}
              >
                {/* Timeline Events */}
                <SyncDragY className="scrollbar-hide hide-scrollbar relative h-full w-full">
                  {visibleLogData.map((item, index) =>
                    item.time === undefined ? (
                      // Render TimelineProcessBar for duration events
                      <TimelineProcessBar
                        index={index}
                        key={item.id}
                        item={item}
                        isHovered={hoveredId === item.id}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={(time: number) => {
                          setTemporalMarkers((prev) => [...prev, time]);
                        }}
                        viewStart={viewStart}
                        viewWindow={viewDuration}
                        timeToPercent={timeToPercent}
                      />
                    ) : (
                      // Render TimelineEvent for instant events (with time property)
                      <TimelineEvent
                        key={item.id}
                        item={item}
                        isHovered={hoveredId === item.id}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={(time: number) => {
                          setTemporalMarkers((prev) => [...prev, time]);
                        }}
                        timeToPercent={timeToPercent}
                        index={index}
                      />
                    ),
                  )}
                </SyncDragY>

                {/* Out of range wedges (left) */}
                <SyncScrollSlave className="scrollbar-hide pointer-events-none absolute top-0 left-0 z-10 h-full w-2">
                  {visibleLogData.map((item, index) => (
                    <LeftWedge
                      key={`left-wedge-${item.id}`}
                      item={item}
                      classes={rightWedgeClasses}
                      viewStart={viewStart}
                      index={index}
                    />
                  ))}
                </SyncScrollSlave>

                {/* Out of range wedges (right) */}
                <SyncScrollSlave className="scrollbar-hide pointer-events-none absolute top-0 right-0 z-10 h-full w-2">
                  {visibleLogData.map((item, index) => (
                    <RightWedge
                      key={`right-wedge-${item.id}`}
                      item={item}
                      classes={leftWedgeClasses}
                      viewEnd={viewStart + viewDuration}
                      index={index}
                    />
                  ))}
                </SyncScrollSlave>

                {/* Custom children content */}
                {children}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 justify-center pb-4">
                  <NavigationControls
                    viewDuration={viewDuration}
                    handlePan={handlePan}
                    handleZoomDragStart={handleZoomDragStart}
                  />
                </div>
              </WheelZoomContext>

              {temporalMarkers.map((time, index) => (
                <div
                  key={`marker-${time}-${index}`}
                  className="pointer-events-none absolute top-0 h-8 w-20 cursor-pointer"
                  style={{
                    zIndex: 110,
                    left: `calc(${timeToPercent(time)}% - 2.5rem)`,
                  }}
                  onClick={() => {
                    setTemporalMarkers((prev) =>
                      prev.filter((_, i) => i !== index),
                    );
                  }}
                  title="Click to remove marker"
                >
                  <div className="pointer-events-auto relative h-full w-full" />
                  <CursorOverlay
                    left={50}
                    label={`T${index + 1}`}
                    color="var(--tone-blue)"
                    showReadout={true}
                    variant="static"
                    zIndex={110}
                  />
                </div>
              ))}

              {/*Interactive cursor with readout */}
              {cursorVisible && (
                <CursorOverlay
                  left={cursorPosition}
                  label={cursorLabel}
                  color="var(--tone-red)"
                  showReadout
                  showMagnet={showMagnet}
                  className="transition-opacity duration-150"
                  zIndex={100}
                />
              )}
            </div>
          </div>
        </div>
      </SyncScrollProvider>
    </TooltipProvider>
  );
}
