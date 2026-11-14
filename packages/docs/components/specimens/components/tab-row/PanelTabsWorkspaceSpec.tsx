import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowDownLeft, Plus } from "lucide-react";
import { TabRow } from "@dreamlake/uikit";

const MEMO_ID = "6af89080efca7d15a5c451f7";
const PANELS = [
  { key: "navigation", name: "Left panel", label: "E1 · Left panel" },
  { key: "editor", name: "Editor", label: "E2 · Editor" },
  { key: "chat", name: "Chat", label: "E3 · Chat" },
] as const;
type PanelKey = (typeof PANELS)[number]["key"];
type PreviewTab = { value: string; label: string };

/** A workspace composition of the existing TabRow, with local preview content. */
export function PanelTabsWorkspaceSpec() {
  const id = useId();
  const nextDraft = useRef(1);
  const workspace = useRef<HTMLElement>(null);
  const [editorStrip, setEditorStrip] = useState({
    inset: 25,
    overflow: false,
  });
  const [status, setStatus] = useState("");
  const [tabs, setTabs] = useState<Record<PanelKey, PreviewTab[]>>({
    navigation: [
      { value: "workspace", label: "Workspace" },
      { value: "library", label: "Library" },
    ],
    editor: [{ value: "memo", label: "Design memo" }],
    chat: [
      { value: "session", label: "Chat session" },
      { value: "review", label: "Review" },
    ],
  });
  const [selected, setSelected] = useState<Record<PanelKey, string>>({
    navigation: "workspace",
    editor: "memo",
    chat: "session",
  });

  useEffect(() => {
    const root = workspace.current;
    const header = root?.querySelector<HTMLElement>(
      '[data-workspace-panel="editor"] .dl-tabs-workspace-header',
    );
    const column = root?.querySelector<HTMLElement>(
      '[data-workspace-panel="editor"] [role="tabpanel"]:not([hidden]) .dl-tabs-workspace-editor-column',
    );
    const scroll = header?.querySelector<HTMLElement>(".uikit-tab-row-scroll");
    if (!header || !column || !scroll || typeof ResizeObserver === "undefined")
      return;
    const measure = () => {
      const inset =
        column.getBoundingClientRect().left -
        header.getBoundingClientRect().left;
      // Compare natural tab width with aligned space, even after the row expands.
      const controls =
        header
          .querySelector<HTMLElement>(".uikit-tab-row-controls")
          ?.getBoundingClientRect().width ?? 22;
      const overflow =
        scroll.scrollWidth + controls + 36 > header.clientWidth - inset - 8;
      setEditorStrip((previous) =>
        previous.inset === inset && previous.overflow === overflow
          ? previous
          : { inset, overflow },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(column);
    measure();
    return () => observer.disconnect();
  }, [tabs.editor.length, selected.editor]);

  return (
    <section
      className="dl-tabs-workspace-spec"
      data-panel-tabs-workspace
      ref={workspace}
    >
      <h3>E · Workspace context — proposed UI</h3>
      <p className="dl-tabs-workspace-intro">
        Shared S-curved tabs beside the left panel, editor, and chat. The space
        around each panel shows the workspace background; the selected tab joins
        its panel body. Inactive tabs use a different shade.
      </p>
      <div className="dl-tabs-workspace-canvas">
        <div className="dl-tabs-workspace-caption">Workspace background</div>
        <div className="dl-tabs-workspace-grid">
          {PANELS.map(({ key, name, label }) => (
            <section
              className="dl-tabs-workspace-panel"
              key={key}
              aria-label={label}
              data-workspace-panel={key}
            >
              <div className="dl-tabs-workspace-panel-caption">{label}</div>
              <div
                className="dl-tabs-workspace-header"
                data-editor-overflow={
                  (key === "editor" && editorStrip.overflow) || undefined
                }
                style={
                  key === "editor"
                    ? ({
                        "--workspace-editor-inset": `${editorStrip.inset}px`,
                      } as CSSProperties)
                    : undefined
                }
              >
                <TabRow
                  aria-label={`${name} preview tabs`}
                  value={selected[key]}
                  minTabWidth={94}
                  preferredTabWidth={170}
                  tabs={tabs[key].map((tab) => ({
                    ...tab,
                    fitContent: true,
                    id: `${id}-${key}-${tab.value}-tab`,
                    panelId: `${id}-${key}-${tab.value}-body`,
                    trailing:
                      tab.value === "memo" ? (
                        <a
                          className="dl-tabs-workspace-hash"
                          href={`https://dreamlake.ai/fortyfive/memos/${MEMO_ID}`}
                          title={`Memo ${MEMO_ID}`}
                          aria-label={`Open memo ${MEMO_ID}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          #6af890
                        </a>
                      ) : undefined,
                  }))}
                  onValueChange={(value) =>
                    setSelected((current) => ({ ...current, [key]: value }))
                  }
                  onClose={(value) => {
                    const index = tabs[key].findIndex(
                      (tab) => tab.value === value,
                    );
                    const remaining = tabs[key].filter(
                      (tab) => tab.value !== value,
                    );
                    setTabs((current) => ({ ...current, [key]: remaining }));
                    if (selected[key] === value) {
                      setSelected((current) => ({
                        ...current,
                        [key]:
                          remaining[Math.min(index, remaining.length - 1)]
                            ?.value ?? "",
                      }));
                    }
                    setStatus(`Closed ${name.toLowerCase()} preview tab.`);
                  }}
                  trailing={
                    <button
                      className="dl-tabs-workspace-action"
                      type="button"
                      aria-label={`Add ${name.toLowerCase()} preview tab`}
                      title={`Add ${name.toLowerCase()} preview tab`}
                      onClick={() => {
                        const number = nextDraft.current++;
                        const value = `preview-${number}`;
                        setTabs((current) => ({
                          ...current,
                          [key]: [
                            ...current[key],
                            { value, label: `Draft ${number}` },
                          ],
                        }));
                        setSelected((current) => ({
                          ...current,
                          [key]: value,
                        }));
                      }}
                    >
                      <Plus size={13} aria-hidden />
                    </button>
                  }
                />
                <button
                  type="button"
                  className="dl-tabs-workspace-action dl-tabs-workspace-undock"
                  aria-label={`Preview undock ${name.toLowerCase()} panel`}
                  title="Undock — placement preview"
                  onClick={() =>
                    setStatus(
                      `${name} undock placement preview; this example does not move panels.`,
                    )
                  }
                >
                  <ArrowDownLeft size={14} aria-hidden />
                </button>
              </div>
              <div className="dl-tabs-workspace-body">
                {tabs[key].map((tab) => (
                  <div
                    key={tab.value}
                    id={`${id}-${key}-${tab.value}-body`}
                    role="tabpanel"
                    aria-labelledby={`${id}-${key}-${tab.value}-tab`}
                    hidden={selected[key] !== tab.value}
                    tabIndex={0}
                  >
                    {key === "navigation" ? (
                      <>
                        <div className="dl-tabs-workspace-project">
                          fortyfive / dreamlake
                        </div>
                        <ul className="dl-tabs-workspace-navigation">
                          {(tab.value === "library"
                            ? ["Library", "Files", "Assets"]
                            : ["Memos", "Sessions", "Library", "Compute"]
                          ).map((item, index) => (
                            <li
                              key={item}
                              data-current={index === 0 || undefined}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : key === "editor" ? (
                      <div className="dl-tabs-workspace-editor-column">
                        <div className="dl-tabs-workspace-toolbar">
                          {tab.label}
                        </div>
                        <textarea
                          className="dl-tabs-workspace-editor"
                          aria-label={`${tab.label} preview content`}
                          defaultValue={
                            tab.value === "memo"
                              ? "Shared panel tabs\n\nThe selected tab connects into the document body.\n\nKeep the existing editor and panel controls."
                              : tab.value === "readme"
                                ? "# DreamLake\n\nWorkspace notes and project files."
                                : ""
                          }
                          spellCheck={false}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="dl-tabs-workspace-chat-history">
                          <p className="dl-tabs-workspace-user">
                            Show the tabs beside the editor and left panel.
                          </p>
                          <p>
                            The selected chat tab shares this panel’s
                            background. Other sessions stay visible above.
                          </p>
                        </div>
                        <textarea
                          className="dl-tabs-workspace-composer"
                          aria-label={`${tab.label} preview message`}
                          placeholder="Message…"
                          rows={3}
                        />
                      </>
                    )}
                  </div>
                ))}
                {!tabs[key].length && (
                  <p className="dl-tabs-workspace-empty">
                    No open tabs. Use + to open a preview draft.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
      <p className="dl-tabs-workspace-note">
        Layout preview using shared tabs. Editor and message drafts stay mounted
        when switching tabs. Undock placement is shown at each right corner;
        this specimen does not implement docking or send messages. The editor
        starts its tabs at the text column’s left edge. When crowded, its strip
        expands across the panel before scrolling; the text stays fixed.
      </p>
      <div className="dl-tabs-workspace-status" role="status">
        {status}
      </div>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.dl-tabs-workspace-spec{color:var(--ink);font-size:12px;line-height:1.5;container-type:inline-size}
.dl-tabs-workspace-spec h3{font-size:15px;margin:0 0 8px}
.dl-tabs-workspace-intro,.dl-tabs-workspace-note{color:var(--uikit-muted);margin:0 0 16px;max-width:76ch}
.dl-tabs-workspace-canvas{background:var(--panel-bg,var(--bg));padding:20px 24px 28px;border:1px solid var(--faint);border-radius:10px}
.dl-tabs-workspace-caption{color:var(--uikit-muted);font-size:10px;margin-bottom:18px;letter-spacing:.04em}
.dl-tabs-workspace-grid{display:grid;grid-template-columns:minmax(150px,.65fr) minmax(220px,1.2fr) minmax(220px,1fr);gap:18px;align-items:start}
.dl-tabs-workspace-panel{min-width:0}
.dl-tabs-workspace-panel-caption{font-size:11px;color:var(--uikit-muted);margin-bottom:8px}
.dl-tabs-workspace-header{display:flex;align-items:flex-end;gap:4px;min-width:0;padding:8px 8px 0;background:var(--panel-bg,var(--bg))}
.dl-tabs-workspace-panel[data-workspace-panel="editor"] .dl-tabs-workspace-header{padding-left:max(0px,calc(var(--workspace-editor-inset,25px) - 8px))}
.dl-tabs-workspace-panel[data-workspace-panel="editor"] .dl-tabs-workspace-header[data-editor-overflow]{padding-left:8px}
.dl-tabs-workspace-header .uikit-tab-row{width:auto;max-width:calc(100% - 26px);flex:0 1 auto;padding-inline:0}
.dl-tabs-workspace-header .uikit-tab-row-scroll{flex:0 1 auto}
.dl-tabs-workspace-header .uikit-tab-row-item-label{padding-inline:8px}
.dl-tabs-workspace-action{display:inline-flex;align-items:center;justify-content:center;flex:0 0 22px;width:22px;height:24px;border:0;border-radius:4px;padding:0;color:var(--uikit-muted);background:transparent;cursor:pointer}
.dl-tabs-workspace-action:hover{background:color-mix(in srgb,var(--ink) 7%,transparent);color:var(--ink)}
.dl-tabs-workspace-action:focus-visible,.dl-tabs-workspace-hash:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:1px}
.dl-tabs-workspace-undock{margin-left:auto;margin-bottom:4px}
.dl-tabs-workspace-hash{font:10px var(--font-uikit-mono,monospace);color:var(--uikit-muted);text-decoration:none;white-space:nowrap}
.dl-tabs-workspace-body{position:relative;min-height:310px;background:var(--bg);border:1px solid var(--faint);border-top:0;border-radius:0 0 7px 7px;padding:16px 12px}
.dl-tabs-workspace-body [hidden]{display:none}
.dl-tabs-workspace-panel[data-workspace-panel="editor"] .dl-tabs-workspace-body{padding-inline:0}
.dl-tabs-workspace-editor-column{width:calc(100% - 48px);max-width:520px;margin-inline:auto}
.dl-tabs-workspace-project{font-size:10px;color:var(--uikit-muted);overflow-wrap:anywhere;margin-bottom:20px}
.dl-tabs-workspace-navigation{list-style:none;padding:0;margin:0}
.dl-tabs-workspace-navigation li{padding:7px 9px;margin:3px 0;border-radius:5px;color:var(--uikit-muted)}
.dl-tabs-workspace-navigation li[data-current]{background:color-mix(in srgb,var(--ink) 6%,var(--bg));color:var(--ink)}
.dl-tabs-workspace-toolbar{font-size:11px;border-bottom:1px solid var(--faint);padding-bottom:10px;margin-bottom:12px}
.dl-tabs-workspace-editor{display:block;box-sizing:border-box;resize:vertical;width:100%;min-height:240px;border:0;background:transparent;color:var(--ink);font:12px/1.8 var(--font-uikit-mono,monospace)}
.dl-tabs-workspace-chat-history{min-height:200px;font-size:12px}
.dl-tabs-workspace-chat-history p{margin:0 0 18px}
.dl-tabs-workspace-user{padding:10px;border-radius:8px;background:color-mix(in srgb,var(--ink) 5%,var(--bg))}
.dl-tabs-workspace-composer{box-sizing:border-box;width:100%;resize:vertical;padding:10px;border:1px solid var(--faint);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit}
.dl-tabs-workspace-note{font-size:11px;margin:12px 0 0}
.dl-tabs-workspace-status{min-height:18px;font-size:11px;color:var(--uikit-muted)}
.dl-tabs-workspace-empty{color:var(--uikit-muted)}
@container(max-width:760px){.dl-tabs-workspace-canvas{padding:14px}.dl-tabs-workspace-grid{grid-template-columns:minmax(130px,.7fr) minmax(210px,1.3fr);gap:16px}.dl-tabs-workspace-panel:last-child{grid-column:2}.dl-tabs-workspace-body{min-height:260px}}
@container(max-width:440px){.dl-tabs-workspace-grid{grid-template-columns:minmax(0,1fr)}.dl-tabs-workspace-panel:last-child{grid-column:auto}.dl-tabs-workspace-body{min-height:180px}.dl-tabs-workspace-editor{min-height:180px}.dl-tabs-workspace-chat-history{min-height:160px}}
`;
