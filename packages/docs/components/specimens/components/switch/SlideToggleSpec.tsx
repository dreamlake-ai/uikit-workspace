import { useState } from "react";
import { Code, Eye } from "lucide-react";
import { SlideToggle, VimToggle } from "@dreamlake/uikit";

export const SlideToggleSpec = () => {
  const [vim, setVim] = useState(false);
  const [preview, setPreview] = useState(true);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <VimToggle on={vim} onToggle={() => setVim((v) => !v)} />
      <SlideToggle
        on={preview}
        onToggle={() => setPreview((v) => !v)}
        label="Markdown preview"
        title={preview ? "Preview" : "Source"}
        left={{ node: <Code size={11} />, w: 20 }}
        right={{ node: <Eye size={11} />, w: 20 }}
      />
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 11,
          color: "var(--uikit-muted)",
        }}
      >
        {vim ? "vim" : "plain"} · {preview ? "preview" : "source"}
      </span>
    </div>
  );
};
