export const TOTAL_DURATION = 22;

export const formatDuration = (seconds: number): string => {
  const sign = seconds < 0 ? "-" : "";
  const absSeconds = Math.abs(seconds);
  if (absSeconds < 1) {
    if (absSeconds < 0.0005) return "0s";
    return `${sign}${Math.round(absSeconds * 1000)}ms`;
  }
  if (absSeconds < 60) return `${sign}${absSeconds.toFixed(3)}s`;

  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 3600;
  const SECONDS_IN_DAY = 86400;
  const SECONDS_IN_MONTH = 2592000;
  const SECONDS_IN_YEAR = 31536000;

  if (absSeconds < SECONDS_IN_HOUR) {
    const m = Math.floor(absSeconds / SECONDS_IN_MINUTE);
    const s = absSeconds % SECONDS_IN_MINUTE;
    return `${sign}${m}m ${s.toFixed(2).padStart(5, "0")}s`;
  }
  if (absSeconds < SECONDS_IN_DAY) {
    const h = Math.floor(absSeconds / SECONDS_IN_HOUR);
    const m = Math.floor((absSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    const s = Math.floor(absSeconds % SECONDS_IN_MINUTE);
    return `${sign}${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  if (absSeconds < SECONDS_IN_MONTH) {
    const d = Math.floor(absSeconds / SECONDS_IN_DAY);
    const h = Math.floor((absSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const m = Math.floor((absSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    return `${sign}${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }
  if (absSeconds < SECONDS_IN_YEAR) {
    const mo = Math.floor(absSeconds / SECONDS_IN_MONTH);
    const d = Math.floor((absSeconds % SECONDS_IN_MONTH) / SECONDS_IN_DAY);
    const h = Math.floor((absSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    return `${sign}${mo}mo ${String(d).padStart(3, "0")}d ${String(h).padStart(2, "0")}h`;
  }
  const y = Math.floor(absSeconds / SECONDS_IN_YEAR);
  const mo = Math.floor((absSeconds % SECONDS_IN_YEAR) / SECONDS_IN_MONTH);
  const d = Math.floor((absSeconds % SECONDS_IN_MONTH) / SECONDS_IN_DAY);
  return `${sign}${y}y ${String(mo).padStart(2, "0")}mo ${String(d).padStart(3, "0")}d`;
};

// Color class maps — mapped onto the DreamLake 6-tone palette.
export const borderColorClasses: Record<string, string> = {
  blue: "border-uikit-tone-blue",
  green: "border-uikit-tone-green",
  orange: "border-uikit-tone-amber",
  purple: "border-uikit-tone-purple",
  "gray-light": "border-uikit-faint",
  "gray-medium": "border-uikit-tone-warm-gray",
};

export const colorClasses: Record<string, string> = {
  blue: "bg-uikit-tone-blue",
  green: "bg-uikit-tone-green",
  orange: "bg-uikit-tone-amber",
  purple: "bg-uikit-tone-purple",
  "gray-light": "bg-uikit-ink-12",
  "gray-medium": "bg-uikit-tone-warm-gray",
};

export const leftWedgeClasses: Record<string, string> = {
  blue: "border-l-uikit-tone-blue",
  green: "border-l-uikit-tone-green",
  orange: "border-l-uikit-tone-amber",
  purple: "border-l-uikit-tone-purple",
  "gray-light": "border-l-uikit-tone-warm-gray",
  "gray-medium": "border-l-uikit-tone-warm-gray",
};

export const rightWedgeClasses: Record<string, string> = {
  blue: "border-r-uikit-tone-blue",
  green: "border-r-uikit-tone-green",
  orange: "border-r-uikit-tone-amber",
  purple: "border-r-uikit-tone-purple",
  "gray-light": "border-r-uikit-tone-warm-gray",
  "gray-medium": "border-r-uikit-tone-warm-gray",
};
