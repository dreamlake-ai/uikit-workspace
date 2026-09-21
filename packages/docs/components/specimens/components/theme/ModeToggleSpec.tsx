import { useState } from "react";
import {
  ThemeCycleToggle,
  ThemeModeToggle,
  type BaseTheme,
} from "@dreamlake/uikit";

/**
 * Controlled, so picking a segment here does NOT drive the docs site's own
 * theme — the page keeps whatever you set in the topbar, and the toggle still
 * animates exactly as it would in an app.
 */
export const ModeToggleSpec = () => {
  const [theme, setTheme] = useState<BaseTheme>("system");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <ThemeModeToggle value={theme} onValueChange={setTheme} />
      <ThemeModeToggle
        value={theme}
        onValueChange={setTheme}
        enableSystem={false}
      />
      <ThemeModeToggle value={theme} onValueChange={setTheme} size={28} />
      <ThemeCycleToggle size={28} value={theme} onValueChange={setTheme} />
      <ThemeCycleToggle size={32} value={theme} onValueChange={setTheme} />
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 11,
          color: "var(--uikit-muted)",
        }}
      >
        {theme}
      </span>
    </div>
  );
};
