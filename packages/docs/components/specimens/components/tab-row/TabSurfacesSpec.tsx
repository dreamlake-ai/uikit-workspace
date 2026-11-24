import { useId, useState, type CSSProperties } from "react";
import {
  DocumentTabHeading,
  TabRow,
  ToggleButton,
  ToggleButtons,
} from "@dreamlake/uikit";

const styles = `
[data-tab-surfaces]{display:grid;gap:24px;padding:16px;background:var(--uikit-workspace-bg);border-radius:12px}
[data-tab-surfaces] section{min-width:0}
[data-tab-surfaces] h3{font-size:14px;margin:0 0 4px}
[data-tab-surfaces] p{font-size:12px;margin:0 0 12px;color:var(--muted)}
[data-tab-surfaces] [data-surface-body]{background:var(--uikit-document-surface);padding:16px;min-height:110px;border-radius:0 12px 12px 12px}
[data-tab-surfaces] [data-surface-body] p{color:var(--ink)}
[data-tab-surfaces] [data-surface-body] textarea{width:100%;min-height:64px;background:transparent;color:inherit;border:1px solid var(--faint);border-radius:6px;padding:8px;box-sizing:border-box}
[data-tab-surfaces] [data-surface-style="workspace"] .uikit-document-tab{--uikit-document-active-gradient:var(--uikit-document-subtle-gradient)}
[data-tab-surfaces] [data-surface-style="workspace"] .uikit-document-tab[data-active]{--uikit-tab-line:color-mix(in srgb,var(--ink) 12%,transparent);border:1px solid var(--uikit-tab-line);border-bottom:0}
[data-tab-surfaces] header{display:flex;align-items:flex-end;min-height:30px}
`;

function SurfaceExample({
  workspace = false,
  panel = false,
}: {
  workspace?: boolean;
  panel?: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState("first");
  const surface = workspace
    ? "var(--uikit-workspace-bg)"
    : panel
      ? "var(--panel-bg)"
      : "var(--bg)";
  const title = workspace
    ? "Workspace background"
    : panel
      ? "Panel surface"
      : "Document surface";
  const labels = workspace ? ["Terminal", "Chat"] : ["File preview", "Details"];
  return (
    <section
      data-surface-style={workspace ? "workspace" : "document"}
      style={{ "--uikit-document-surface": surface } as CSSProperties}
    >
      <h3>{title}</h3>
      <p>
        {workspace
          ? "The tab joins the workspace ground; a subtle gradient and outline identify selection."
          : `The selected tab and content share ${panel ? "--panel-bg" : "--bg"}, with a solid face.`}
      </p>
      <TabRow
        aria-label={title}
        value={active}
        onValueChange={setActive}
        startEdge="flush"
        tabs={labels.map((label, i) => ({
          value: i ? "second" : "first",
          label,
          id: `${id}-tab-${i}`,
          panelId: `${id}-panel-${i}`,
          fitContent: true,
        }))}
      />
      <div data-surface-body="">
        {labels.map((label, i) => (
          <div
            key={label}
            id={`${id}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${i}`}
            hidden={active !== (i ? "second" : "first")}
          >
            <p>{label}</p>
            <textarea
              aria-label={`${title}: ${label} draft`}
              defaultValue={
                workspace
                  ? "$ ready"
                  : "Switch tabs and return: this draft stays mounted."
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function TabSurfacesSpec() {
  return (
    <div data-tab-surfaces="">
      <style>{styles}</style>
      <SurfaceExample />
      <SurfaceExample panel />
      <SurfaceExample workspace />
      <section
        style={{ "--uikit-document-surface": "var(--bg)" } as CSSProperties}
      >
        <h3>List heading</h3>
        <p>A breadcrumb is a heading, not a selectable tab.</p>
        <header>
          <DocumentTabHeading>workspace / files</DocumentTabHeading>
        </header>
        <div data-surface-body="">
          image.png
          <br />
          video.mp4
        </div>
      </section>
    </div>
  );
}

export function FileViewSurfaceSpec() {
  const [view, setView] = useState("terminal");
  const files = view === "files";
  return (
    <div data-tab-surfaces="">
      <style>{styles}</style>
      <section
        data-surface-style={files ? "document" : "workspace"}
        style={
          {
            "--uikit-document-surface": files
              ? "var(--bg)"
              : "var(--uikit-workspace-bg)",
          } as CSSProperties
        }
      >
        <TabRow
          aria-label="Computer"
          value="computer"
          onValueChange={() => {}}
          startEdge="flush"
          tabs={[{ value: "computer", label: "My computer", fitContent: true }]}
          trailing={
            <ToggleButtons
              value={view}
              onValueChange={setView}
              variant="panel"
              size="sm"
              aria-label="Computer view"
            >
              <ToggleButton value="terminal">Terminal</ToggleButton>
              <ToggleButton value="files">Files</ToggleButton>
            </ToggleButtons>
          }
        />
        <div data-surface-body="">
          <div hidden={files}>
            <textarea
              aria-label="Retained terminal draft"
              defaultValue="$ ls"
            />
          </div>
          <div hidden={!files}>
            <p>Files</p>
            <div>image.png</div>
            <div>video.mp4</div>
          </div>
        </div>
      </section>
    </div>
  );
}
