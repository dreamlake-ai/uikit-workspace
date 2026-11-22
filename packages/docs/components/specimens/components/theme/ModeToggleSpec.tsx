import { useState } from "react";
import {
  ThemeCycleToggle,
  ThemeModeToggle,
  type BaseTheme,
} from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

/**
 * Controlled, so picking a segment here does NOT drive the docs site's own
 * theme — the page keeps whatever you set in the topbar, and the toggle still
 * animates exactly as it would in an app.
 */
export const ModeToggleSpec = () => {
  const [theme, setTheme] = useState<BaseTheme>("system");
  return (
    <ShapePair>
      {(shape) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <ThemeModeToggle
            shape={shape}
            value={theme}
            onValueChange={setTheme}
          />
          <ThemeModeToggle
            shape={shape}
            value={theme}
            onValueChange={setTheme}
            enableSystem={false}
          />
          <ThemeModeToggle
            shape={shape}
            value={theme}
            onValueChange={setTheme}
            size={28}
          />
          <ThemeCycleToggle
            shape={shape}
            size={28}
            value={theme}
            onValueChange={setTheme}
          />
          <ThemeCycleToggle
            shape={shape}
            size={32}
            value={theme}
            onValueChange={setTheme}
          />
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
      )}
    </ShapePair>
  );
};
