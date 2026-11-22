import { useState } from "react";
import { SquareTerminal, MessageSquare } from "lucide-react";
import { SlideToggle, VimToggle, PreviewToggle } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

export const SlideToggleSpec = () => {
  const [vim, setVim] = useState(false);
  const [preview, setPreview] = useState(true);
  const [chat, setChat] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ShapePair>
        {(shape) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <VimToggle
              shape={shape}
              on={vim}
              onToggle={() => setVim((v) => !v)}
            />
            <PreviewToggle
              shape={shape}
              on={preview}
              onToggle={() => setPreview((v) => !v)}
            />
            <SlideToggle
              shape={shape}
              on={chat}
              onToggle={() => setChat((v) => !v)}
              label="Chat"
              left={{ node: <SquareTerminal size={14} aria-hidden />, w: 20 }}
              right={{ node: <MessageSquare size={14} aria-hidden />, w: 20 }}
            />
            <VimToggle
              shape={shape}
              on
              disabled
              onToggle={() => {}}
              label="Vim mode unavailable"
            />
          </div>
        )}
      </ShapePair>
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 11,
          color: "var(--uikit-muted)",
        }}
      >
        {vim ? "vim" : "plain"} · {preview ? "preview" : "source"} ·{" "}
        {chat ? "chat" : "terminal"}
      </span>
    </div>
  );
};
