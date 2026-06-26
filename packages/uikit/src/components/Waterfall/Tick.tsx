export interface TimelineTickProps {
  /** Time value for this tick */
  time: number
  /** Label to display */
  label: string
  /** Function to convert time to percentage */
  timeToPercent: (time: number) => number
  /** Z-index for layering */
  zIndex?: number
}

/**
 * Timeline tick mark with label. Shows time divisions on the timeline ruler.
 */
export function Tick({ time, label, timeToPercent, zIndex = 10 }: TimelineTickProps) {
  const naturalCenterPercent = timeToPercent(time)

  if (naturalCenterPercent < -20 || naturalCenterPercent > 120) {
    return null
  }

  // Keep label visible even when tick is near edges
  const labelHalfWidthPercent = 3
  const clampedCenterPercent = Math.min(
    100 - labelHalfWidthPercent,
    Math.max(labelHalfWidthPercent, naturalCenterPercent),
  )

  return (
    <>
      {/* Tick line */}
      <div
        className="bg-uikit-faint absolute top-0 h-full w-px"
        style={{ left: `${naturalCenterPercent}%` }}
      />
      {/* Label */}
      <div
        className="bg-uikit-panel text-uikit-muted rounded-[3px] text-uikit-11 pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 px-1 backdrop-blur-sm"
        style={{
          left: `${clampedCenterPercent}%`,
          zIndex,
        }}
      >
        {label}
      </div>
    </>
  )
}
