type ColorValue = string | number | readonly string[] | undefined;

/**
 * Normalize color value from various formats to a hex string (without #)
 * Supports: "#aabbcc", "aabbcc", "0xaabbcc", 0xaabbcc (number), "rgb(...)", etc.
 */
function normalizeColor(colorValue: ColorValue): string {
  if (colorValue === undefined || colorValue === null) {
    return "ffffff";
  }

  // Handle numeric values (e.g., 0xaabbcc or 0xaabbccdd)
  if (typeof colorValue === "number") {
    // Check if it's a 32-bit value (with alpha) or 24-bit (RGB only)
    if (colorValue > 0xffffff) {
      // 0xaabbccdd format - extract RGB, ignore alpha for HTML color input
      const hex = colorValue.toString(16).padStart(8, "0");
      return hex.slice(0, 6); // Take first 6 chars (RGB)
    }
    return colorValue.toString(16).padStart(6, "0");
  }

  if (typeof colorValue === "string") {
    const trimmed = colorValue.trim().toLowerCase();

    // Handle 0x prefix (e.g., "0xaabbcc" or "0xaabbccdd")
    if (trimmed.startsWith("0x")) {
      const hex = trimmed.slice(2);
      if (hex.length > 6) {
        return hex.slice(0, 6); // Take first 6 chars for RGBA format
      }
      return hex.padStart(6, "0");
    }

    // Handle # prefix
    if (trimmed.startsWith("#")) {
      const hex = trimmed.slice(1);
      // Handle shorthand (#abc -> aabbcc)
      if (hex.length === 3) {
        return hex
          .split("")
          .map((c) => c + c)
          .join("");
      }
      if (hex.length === 4) {
        // #rgba shorthand - ignore alpha
        return hex
          .slice(0, 3)
          .split("")
          .map((c) => c + c)
          .join("");
      }
      if (hex.length > 6) {
        return hex.slice(0, 6); // Handle #rrggbbaa
      }
      return hex;
    }

    // Handle rgb/rgba functional notation
    const rgbMatch = trimmed.match(
      /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,
    );
    if (rgbMatch) {
      const r = Math.min(255, parseInt(rgbMatch[1], 10))
        .toString(16)
        .padStart(2, "0");
      const g = Math.min(255, parseInt(rgbMatch[2], 10))
        .toString(16)
        .padStart(2, "0");
      const b = Math.min(255, parseInt(rgbMatch[3], 10))
        .toString(16)
        .padStart(2, "0");
      return r + g + b;
    }

    // Plain hex string (e.g., "aabbcc" or "aabbccdd")
    if (/^[0-9a-f]+$/i.test(trimmed)) {
      if (trimmed.length === 3) {
        return trimmed
          .split("")
          .map((c) => c + c)
          .join("");
      }
      if (trimmed.length > 6) {
        return trimmed.slice(0, 6);
      }
      return trimmed.padStart(6, "0");
    }

    // Return as-is for CSS color names (e.g., "red", "blue")
    return trimmed;
  }

  return "ffffff";
}

export { normalizeColor };
export type { ColorValue };
