import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowDownLeft, MoreHorizontal, Plus } from "lucide-react";
import { TabRow } from "@dreamlake/uikit";

const MEMO_ID = "6af89080efca7d15a5c451f7";
const PANELS = [
  { key: "navigation", name: "Left panel", label: "Left panel" },
  { key: "editor", name: "Editor", label: "Editor" },
  { key: "chat", name: "Chat", label: "Chat" },
] as const;
type PanelKey = (typeof PANELS)[number]["key"];
type TabKind = "navigation" | "editor" | "chat";
type Scenario = "normal" | "crowded" | "chat-in-editor";
type PreviewTab = {
  value: string;
  label: string;
  kind: TabKind;
  scenario?: Scenario;
};
const inScenario = (tab: PreviewTab, scenario: Scenario) =>
  !tab.scenario || tab.scenario === scenario;

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
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [floating, setFloating] = useState<Record<string, boolean>>({});
  const [tabs, setTabs] = useState<Record<PanelKey, PreviewTab[]>>({
    navigation: [
      { value: "workspace", label: "Workspace", kind: "navigation" },
      { value: "library", label: "Library", kind: "navigation" },
    ],
    editor: [
      { value: "memo", label: "Design memo", kind: "editor" },
      {
        value: "readme",
        label: "README.md",
        kind: "editor",
        scenario: "crowded",
      },
      {
        value: "notes",
        label: "Project notes",
        kind: "editor",
        scenario: "crowded",
      },
      {
        value: "changes",
        label: "Changes",
        kind: "editor",
        scenario: "crowded",
      },
      {
        value: "editor-chat",
        label: "Chat beside memo",
        kind: "chat",
        scenario: "chat-in-editor",
      },
    ],
    chat: [
      { value: "session", label: "Chat session", kind: "chat" },
      { value: "review", label: "Review", kind: "chat" },
    ],
  });
  const [selected, setSelected] = useState<Record<PanelKey, string>>({
    navigation: "workspace",
    editor: "memo",
    chat: "session",
  });

  const visibleTabs = (key: PanelKey) =>
    tabs[key].filter(
      (tab) => inScenario(tab, scenario) && !floating[tab.value],
    );

  useEffect(() => {
    const root = workspace.current;
    const header = root?.querySelector<HTMLElement>(
      '[data-workspace-panel="editor"] .dl-tabs-workspace-header',
    );
    const column = root?.querySelector<HTMLElement>(
      '[data-workspace-panel="editor"] [role="tabpanel"]:not([hidden]) .dl-tabs-workspace-editor-column',
    );
    const scroll = header?.querySelector<HTMLElement>(".uikit-tab-row-scroll");
    const row = header?.querySelector<HTMLElement>(".uikit-tab-row");
    if (
      !header ||
      !column ||
      !scroll ||
      !row ||
      typeof ResizeObserver === "undefined"
    )
      return;
    const measure = () => {
      const inset =
        column.getBoundingClientRect().left -
        header.getBoundingClientRect().left;
      // Compare natural tab width with aligned space, even after the row expands.
      const controls =
        header
          .querySelector<HTMLElement>(".dl-tabs-workspace-context-controls")
          ?.getBoundingClientRect().width ?? 0;
      const gap = controls
        ? Number.parseFloat(getComputedStyle(header).columnGap) || 0
        : 0;
      const overflow =
        scroll.scrollWidth + controls + gap >
        header.clientWidth - Math.max(0, inset - 8);
      setEditorStrip((previous) =>
        previous.inset === inset && previous.overflow === overflow
          ? previous
          : { inset, overflow },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(column);
    const controls = header.querySelector<HTMLElement>(
      ".dl-tabs-workspace-context-controls",
    );
    if (controls) observer.observe(controls);
    measure();
    return () => observer.disconnect();
  }, [tabs.editor.length, selected.editor, scenario, floating]);

  return (
    <section
      className="dl-tabs-workspace-spec"
      data-panel-tabs-workspace
      ref={workspace}
    >
      <h3>1 · Workspace context — S-curved tabs</h3>
      <p className="dl-tabs-workspace-intro">
        Shared S-curved tabs beside the left panel, editor, and chat. The space
        around each panel shows the workspace background; the selected tab joins
        its panel body. Inactive tabs use flat labels and separators, with
        rounded hover shading.
      </p>
      <label className="dl-tabs-workspace-scenarios">
        Preview scenario
        <select
          aria-label="Workspace preview scenario"
          value={scenario}
          onChange={(event) => {
            const next = event.target.value as Scenario;
            setScenario(next);
            const preferred =
              next === "chat-in-editor" ? "editor-chat" : "memo";
            setSelected((current) => ({
              ...current,
              editor:
                tabs.editor.find(
                  (tab) => tab.value === preferred && !floating[tab.value],
                )?.value ??
                tabs.editor.find(
                  (tab) => inScenario(tab, next) && !floating[tab.value],
                )?.value ??
                "",
            }));
          }}
        >
          <option value="normal">1.A · Normal editor</option>
          <option value="crowded">1.A · Crowded editor</option>
          <option value="chat-in-editor">1.A · Chat tab in editor panel</option>
        </select>
      </label>
      <div className="dl-tabs-workspace-canvas">
        <div className="dl-tabs-workspace-caption">Workspace background</div>
        <div className="dl-tabs-workspace-grid">
          {PANELS.map(({ key, name, label }) => {
            const shownTabs = visibleTabs(key);
            const activeTab = shownTabs.find(
              (tab) => tab.value === selected[key],
            );
            return (
              <section
                className="dl-tabs-workspace-panel"
                key={key}
                aria-label={label}
                data-workspace-panel={key}
                data-active-tab-kind={activeTab?.kind}
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
                    tabs={shownTabs.map((tab) => ({
                      ...tab,
                      fitContent: true,
                      id: `${id}-${key}-${tab.value}-tab`,
                      panelId: `${id}-${key}-${tab.value}-body`,
                      trailing:
                        tab.value === "memo" && selected[key] === tab.value ? (
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
                      const index = shownTabs.findIndex(
                        (tab) => tab.value === value,
                      );
                      const remaining = tabs[key].filter(
                        (tab) => tab.value !== value,
                      );
                      setTabs((current) => ({ ...current, [key]: remaining }));
                      const visibleRemaining = shownTabs.filter(
                        (tab) => tab.value !== value,
                      );
                      if (selected[key] === value) {
                        setSelected((current) => ({
                          ...current,
                          [key]:
                            visibleRemaining[
                              Math.min(index, visibleRemaining.length - 1)
                            ]?.value ?? "",
                        }));
                      }
                      setStatus(`Closed ${name.toLowerCase()} preview tab.`);
                    }}
                  />
                  <div
                    className="dl-tabs-workspace-context-controls"
                    data-controls-for-kind={activeTab?.kind}
                  >
                    {activeTab?.kind === "chat" && (
                      <>
                        <button
                          className="dl-tabs-workspace-action uikit-document-tab-action"
                          type="button"
                          aria-label={`Add chat in ${name.toLowerCase()} panel`}
                          title="New chat"
                          onClick={() => {
                            const number = nextDraft.current++;
                            const value = `preview-chat-${number}`;
                            setTabs((current) => {
                              const index = current[key].findIndex(
                                (tab) => tab.value === activeTab.value,
                              );
                              if (index < 0) return current;
                              return {
                                ...current,
                                [key]: [
                                  ...current[key].slice(0, index + 1),
                                  {
                                    value,
                                    label: `Chat ${number}`,
                                    kind: "chat",
                                  },
                                  ...current[key].slice(index + 1),
                                ],
                              };
                            });
                            setSelected((current) => ({
                              ...current,
                              [key]: value,
                            }));
                          }}
                        >
                          <Plus size={13} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="dl-tabs-workspace-action uikit-document-tab-action"
                          aria-label={`Float ${activeTab.label} from ${name.toLowerCase()} panel`}
                          title="Float this chat — local preview"
                          onClick={() => {
                            setFloating((current) => ({
                              ...current,
                              [activeTab.value]: true,
                            }));
                            setSelected((current) => ({
                              ...current,
                              [key]:
                                shownTabs.find(
                                  (tab) => tab.value !== activeTab.value,
                                )?.value ?? "",
                            }));
                            setStatus(
                              `Floating only ${activeTab.label}; sibling tabs and its draft stay mounted. Docs preview only.`,
                            );
                          }}
                        >
                          <ArrowDownLeft size={14} aria-hidden />
                        </button>
                      </>
                    )}
                    {activeTab?.kind === "editor" && (
                      <button
                        type="button"
                        className="dl-tabs-workspace-action uikit-document-tab-action"
                        aria-label={`Editor options for ${activeTab.label}`}
                        title="Editor options — placement preview"
                        onClick={() =>
                          setStatus(
                            "Existing editor options placement; this preview does not open a product menu.",
                          )
                        }
                      >
                        <MoreHorizontal size={14} aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
                <div className="dl-tabs-workspace-body">
                  {tabs[key].map((tab) => {
                    const isFloating = !!floating[tab.value];
                    return (
                      <div
                        key={tab.value}
                        id={`${id}-${key}-${tab.value}-body`}
                        role="tabpanel"
                        aria-labelledby={`${id}-${key}-${tab.value}-${isFloating ? "floating-tab" : "tab"}`}
                        hidden={
                          !isFloating &&
                          (selected[key] !== tab.value ||
                            !inScenario(tab, scenario))
                        }
                        data-floating-chat={isFloating || undefined}
                        data-preview-tab={tab.value}
                        tabIndex={0}
                      >
                        <div
                          className="dl-tabs-workspace-float-header"
                          hidden={!isFloating}
                        >
                          <TabRow
                            aria-label={`${tab.label} floating preview`}
                            value={tab.value}
                            tabs={[
                              {
                                value: tab.value,
                                label: tab.label,
                                id: `${id}-${key}-${tab.value}-floating-tab`,
                                panelId: `${id}-${key}-${tab.value}-body`,
                              },
                            ]}
                            onValueChange={() => {}}
                          />
                          <button
                            type="button"
                            className="dl-tabs-workspace-return"
                            onClick={() => {
                              setFloating((current) => ({
                                ...current,
                                [tab.value]: false,
                              }));
                              if (tab.scenario) setScenario(tab.scenario);
                              setSelected((current) => ({
                                ...current,
                                [key]: tab.value,
                              }));
                              setStatus(
                                `Returned ${tab.label} to its original panel; its draft is unchanged.`,
                              );
                            }}
                          >
                            Return to panel
                          </button>
                        </div>
                        {tab.kind === "navigation" ? (
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
                        ) : tab.kind === "editor" ? (
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
                    );
                  })}
                  {!shownTabs.length && (
                    <p className="dl-tabs-workspace-empty">
                      No open tabs in this panel. Floating chats can return
                      here.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <p className="dl-tabs-workspace-note">
        Layout preview using shared tabs. Editor and message drafts stay mounted
        when switching tabs. The active tab type controls the right gutter:
        chats get + and ↙ wherever they appear; editors keep editor options. ↙
        repositions only that chat’s existing DOM as a local floating preview;
        this is not production docking acceptance and does not send messages.
        The editor starts its tabs at the text column’s left edge. When crowded,
        its strip expands across the panel before scrolling; the text stays
        fixed.
      </p>
      <div className="dl-tabs-workspace-status" role="status">
        {status}
      </div>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.dl-tabs-workspace-spec{position:relative;color:var(--ink);font-size:12px;line-height:1.5;container-type:inline-size}
.dl-tabs-workspace-spec h3{font-size:15px;margin:0 0 8px}
.dl-tabs-workspace-intro,.dl-tabs-workspace-note{color:var(--uikit-muted);margin:0 0 16px;max-width:76ch}
.dl-tabs-workspace-canvas{background:var(--uikit-document-strip-surface,var(--uikit-workspace-bg));padding:20px 24px 0;border:0;box-shadow:none}
.dl-tabs-workspace-caption{color:var(--uikit-muted);font-size:10px;margin-bottom:18px;letter-spacing:.04em}
.dl-tabs-workspace-grid{display:grid;grid-template-columns:minmax(150px,.65fr) minmax(220px,1.2fr) minmax(220px,1fr);gap:0;align-items:stretch}
.dl-tabs-workspace-panel{min-width:0;display:flex;flex-direction:column}
.dl-tabs-workspace-panel-caption{font-size:11px;color:var(--uikit-muted);margin-bottom:8px}
.dl-tabs-workspace-header{display:flex;align-items:flex-start;gap:4px;min-width:0;padding:8px 0 0;background:var(--uikit-document-strip-surface,var(--uikit-workspace-bg));border:0;box-shadow:none}
.dl-tabs-workspace-panel[data-workspace-panel="editor"][data-active-tab-kind="editor"] .dl-tabs-workspace-header{padding-left:max(0px,calc(var(--workspace-editor-inset,25px) - 8px))}
.dl-tabs-workspace-panel[data-workspace-panel="editor"] .dl-tabs-workspace-header[data-editor-overflow]{padding-left:0}
.dl-tabs-workspace-header .uikit-tab-row{width:auto;max-width:100%;flex:0 1 auto;padding-inline:0}

.dl-tabs-workspace-header .uikit-tab-row-scroll{flex:0 1 auto}
.dl-tabs-workspace-header .uikit-tab-row-item-label{padding-inline:8px}
.dl-tabs-workspace-context-controls{display:flex;flex:0 0 auto;align-items:flex-start;gap:2px;margin-left:auto;margin-top:0}
.dl-tabs-workspace-context-controls:empty{display:none}
.dl-tabs-workspace-action{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;min-width:32px;height:28px;border:0;border-radius:4px;padding:0 9px;margin:0;cursor:pointer}
.dl-tabs-workspace-action:focus-visible,.dl-tabs-workspace-hash:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:1px}
.dl-tabs-workspace-scenarios{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;color:var(--uikit-muted)}
.dl-tabs-workspace-scenarios select{font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--faint);border-radius:4px;padding:5px 8px}
.dl-tabs-workspace-body [data-floating-chat]{position:absolute;z-index:12;top:42px;right:8px;width:min(320px,calc(100cqw - 40px));padding:12px;background:var(--uikit-document-surface,var(--bg));border:1px solid var(--faint);border-radius:8px;box-shadow:0 8px 24px color-mix(in srgb,var(--ink) 12%,transparent)}
.dl-tabs-workspace-float-header{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.dl-tabs-workspace-float-header .uikit-tab-row{min-width:0;flex:1}
.dl-tabs-workspace-return{font:10px var(--font-uikit-mono,monospace);border:1px solid var(--faint);background:var(--bg);color:var(--ink);border-radius:4px;padding:5px;cursor:pointer}
.dl-tabs-workspace-hash{font:10px var(--font-uikit-mono,monospace);color:var(--uikit-muted);text-decoration:none;white-space:nowrap}
.dl-tabs-workspace-body{position:relative;flex:1;min-height:310px;background:var(--uikit-document-surface,var(--bg));border:0;box-shadow:none;border-radius:0 0 7px 7px;padding:16px 12px}
.dl-tabs-workspace-body [hidden]{display:none}
.dl-tabs-workspace-panel[data-workspace-panel="editor"][data-active-tab-kind="editor"] .dl-tabs-workspace-body{padding-inline:0}
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
@container(max-width:760px){.dl-tabs-workspace-canvas{padding:14px 14px 0}.dl-tabs-workspace-grid{grid-template-columns:minmax(130px,.7fr) minmax(210px,1.3fr);gap:0}.dl-tabs-workspace-panel:last-child{grid-column:2}.dl-tabs-workspace-body{min-height:260px}}
@container(max-width:440px){.dl-tabs-workspace-grid{grid-template-columns:minmax(0,1fr)}.dl-tabs-workspace-panel:last-child{grid-column:auto}.dl-tabs-workspace-body{min-height:180px}.dl-tabs-workspace-editor{min-height:180px}.dl-tabs-workspace-chat-history{min-height:160px}}
`;
