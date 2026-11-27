import { useState } from "react";
import {
  Button,
  TabRow,
  ToggleButton,
  ToggleButtons,
  VimToggle,
} from "@dreamlake/uikit";
import {
  ChevronDown,
  FolderTree,
  MessageSquare,
  SquareTerminal,
  UserPlus,
} from "lucide-react";

const modes = [
  {
    value: "terminal",
    label: "Terminal",
    icon: SquareTerminal,
  },
  { value: "chat", label: "Chat", icon: MessageSquare },
  { value: "files", label: "Files", icon: FolderTree },
];

/** Multi-mode controls share the memo Vim toggle geometry; three or more options keep a neutral track. */
export function PanelModeControlsSpec() {
  const [mode, setMode] = useState("terminal");
  const [vim, setVim] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <section data-panel-toggle-example="" aria-label="Compact session controls">
      <style>{`
        [data-panel-toggle-example]{max-width:720px;background:var(--uikit-workspace-bg);border-radius:12px;padding:12px;color:var(--ink)}
        [data-panel-toggle-example] [data-panel-actions]{display:flex;align-items:center;gap:2px;padding:0}
        [data-panel-toggle-example] [data-panel-action]{padding:0}
        [data-panel-toggle-example] [data-panel-body]{min-height:140px;padding:16px;border-radius:0 12px 12px 12px;background:var(--bg)}
        [data-panel-toggle-example] textarea{width:100%;background:transparent;border:1px solid var(--faint);border-radius:6px;padding:8px;color:inherit}
        [data-panel-toggle-example] [data-panel-notice]{font-size:11px;color:var(--muted);margin:8px 0 0}
      `}</style>
      <TabRow
        aria-label="Example session tabs"
        minTabHeight={28}
        value="research"
        onValueChange={() => {}}
        tabs={[
          { value: "research", label: "Research", fitContent: true },
          { value: "notes", label: "Notes", fitContent: true },
        ]}
        trailing={
          <div data-panel-actions="">
            <Button
              data-panel-action=""
              className="uikit-document-tab-action"
              variant="ghost"
              size="sm"
              aria-label="Share session"
              onClick={() => setNotice("Sharing belongs to this session.")}
            >
              <UserPlus size={14} aria-hidden />
            </Button>
            <ToggleButtons
              variant="panel"
              size="sm"
              value={mode}
              onValueChange={setMode}
              role="group"
              aria-label="Session view"
            >
              {modes.map(({ value, label, icon: Icon }) => (
                <ToggleButton
                  key={value}
                  value={value}
                  icon
                  aria-label={label}
                  title={label}
                >
                  <Icon size={14} aria-hidden />
                </ToggleButton>
              ))}
            </ToggleButtons>
            <Button
              data-panel-action=""
              className="uikit-document-tab-action"
              variant="ghost"
              size="sm"
              aria-label="Session actions"
              onClick={() =>
                setNotice("Contextual actions stay beside the view selector.")
              }
            >
              <ChevronDown size={14} aria-hidden />
            </Button>
          </div>
        }
      />
      <div data-panel-body="">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Memo editor reference
          </span>
          <VimToggle
            on={vim}
            onToggle={() => setVim(!vim)}
            label="Vim style reference"
          />
        </div>
        <div hidden={mode !== "terminal"}>
          <code>$ ready</code>
        </div>
        <div hidden={mode !== "chat"}>
          <textarea
            aria-label="Example chat draft"
            placeholder="Write a message…"
          />
        </div>
        <div hidden={mode !== "files"}>
          <FolderTree size={14} aria-hidden /> workspace / research
        </div>
        {notice && (
          <p data-panel-notice="" role="status">
            {notice}
          </p>
        )}
      </div>
    </section>
  );
}
