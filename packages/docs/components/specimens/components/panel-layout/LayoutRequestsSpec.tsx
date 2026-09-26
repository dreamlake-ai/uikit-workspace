import { useEffect, useState, type KeyboardEvent } from "react";
import {
  createLayoutController,
  type LayoutSnapshot,
  type LayoutResult,
  type PanelNode,
} from "@dreamlake/uikit";
import {
  layoutExampleSets,
  type LayoutExampleSet,
} from "../../../../../uikit/src/components/PanelLayout/layout-examples";

function Illustration({
  snapshot,
  label,
}: {
  snapshot: LayoutSnapshot;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 800 240"
      role="img"
      aria-label={label}
      style={{
        width: "100%",
        display: "block",
        background: "#f8faf6",
        borderRadius: 8,
      }}
    >
      <title>{label}</title>
      {snapshot.regions
        .filter((r) => r.level === "panel")
        .map((region) => {
          const b = region.bounds,
            x = 10 + b.x * 7.8,
            y = 10 + b.y * 2.2,
            w = b.width * 7.8 - 6,
            h = b.height * 2.2 - 6;
          const active = region.tabs.find((t) => t.active),
            artifact = active?.view?.kind === "artifact";
          return (
            <g key={region.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={5}
                fill={artifact ? "#f3e5cf" : "#e8eee3"}
                stroke="#9cad95"
              />
              {region.tabs.map((tab, i) => {
                const tw = (w - 8) / region.tabs.length,
                  tx = x + 4 + i * tw;
                return (
                  <g key={tab.id}>
                    <rect
                      x={tx}
                      y={y + 4}
                      width={Math.max(0, tw - 3)}
                      height={25}
                      rx={3}
                      fill={tab.active ? "#fffef9" : "#dfe6da"}
                      stroke={tab.preview ? "#927446" : "none"}
                      strokeDasharray={tab.preview ? "3 2" : undefined}
                    />
                    <text
                      x={tx + 5}
                      y={y + 21}
                      fill="#263728"
                      fontSize={12}
                      fontFamily="system-ui"
                    >
                      {tab.pinned ? "● " : ""}
                      {(tab.view?.title ?? tab.view?.resource ?? "Empty").slice(
                        0,
                        Math.max(3, Math.floor(tw / 8)),
                      )}
                    </text>
                  </g>
                );
              })}
              {h > 65 && (
                <text
                  x={x + 12}
                  y={y + 56}
                  fontSize={15}
                  fill="#304634"
                  fontFamily="system-ui"
                >
                  {(
                    active?.view?.title ??
                    active?.view?.resource ??
                    "Empty"
                  ).slice(0, Math.floor(w / 9))}
                </text>
              )}
              {h > 100 && (
                <text
                  x={x + 12}
                  y={y + h - 13}
                  fontSize={10}
                  fill="#61705c"
                  fontFamily="monospace"
                >
                  {[...region.names, ...region.roles]
                    .filter((x, i, a) => a.indexOf(x) === i)
                    .join(" · ")
                    .slice(0, Math.floor(w / 7)) || region.id}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
function Example({ set }: { set: LayoutExampleSet }) {
  const [selected, setSelected] = useState(0);
  const [state, setState] = useState<{
    before: LayoutSnapshot;
    after: LayoutSnapshot;
    result?: LayoutResult;
  }>(() => {
    const root = set.start(),
      controller = createLayoutController({
        getRoot: () => root,
        replaceRoot: () => {},
      }),
      snapshot = controller.inspect();
    return { before: snapshot, after: snapshot };
  });
  const branch = set.branches[selected];
  useEffect(() => {
    let alive = true,
      root: PanelNode = set.start();
    const controller = createLayoutController({
      getRoot: () => root,
      replaceRoot: (next) => {
        root = next;
      },
      canDispose: () => branch.guard !== false,
    });
    const before = controller.inspect();
    void (async () => {
      let result: LayoutResult | undefined;
      for (const request of branch.requests) {
        result = await controller.apply(request);
        if (result.status !== "applied") break;
      }
      if (alive) setState({ before, after: controller.inspect(), result });
    })();
    return () => {
      alive = false;
    };
  }, [set, branch]);
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    let next = selected;
    if (event.key === "ArrowRight") next = (selected + 1) % set.branches.length;
    else if (event.key === "ArrowLeft")
      next = (selected + set.branches.length - 1) % set.branches.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = set.branches.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    event.currentTarget
      .querySelectorAll<HTMLButtonElement>("[role=tab]")
      [next]?.focus();
  }
  return (
    <section className="layout-example" id={`example-${set.id}`}>
      <h3>{set.title}</h3>
      <p>{set.description}</p>
      <p className="layout-caption">A · Shared starting layout</p>
      <Illustration
        snapshot={state.before}
        label={`${set.title}: starting layout`}
      />
      <div
        className="layout-branches"
        role="tablist"
        aria-label={`${set.title} command branches`}
        onKeyDown={onKey}
      >
        {set.branches.map((b, i) => (
          <button
            key={b.title}
            type="button"
            role="tab"
            id={`${set.id}-tab-${i}`}
            aria-controls={`${set.id}-result`}
            aria-selected={i === selected}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => setSelected(i)}
          >
            {b.title}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${set.id}-result`}
        aria-labelledby={`${set.id}-tab-${selected}`}
      >
        <p>{branch.explanation}</p>
        <details>
          <summary>
            Exact request{branch.requests.length > 1 ? " sequence" : ""}
          </summary>
          <pre>
            {JSON.stringify(
              branch.requests.length === 1
                ? branch.requests[0]
                : branch.requests,
              null,
              2,
            )}
          </pre>
        </details>
        <p className="layout-caption">B · Result</p>
        <Illustration
          snapshot={state.after}
          label={`${set.title}: ${branch.title} result`}
        />
        <p className="layout-outcome" aria-live="polite">
          <strong>{state.result?.status ?? "Resolving"}</strong>
          {state.result
            ? ` · ${state.result.effect ?? "no change"} · ${state.result.reason}`
            : ""}
        </p>
      </div>
    </section>
  );
}
export function LayoutRequestsSpec() {
  return (
    <div className="layout-examples">
      <style>{`
.layout-examples .layout-example{border:1px solid var(--border,#d7dfd1);border-radius:12px;padding:22px;margin:28px 0;scroll-margin-top:80px}
.layout-examples h3{margin:0 0 8px}.layout-examples p{font-size:14px}.layout-examples .layout-caption{text-transform:uppercase;letter-spacing:.1em;font-size:10px;color:var(--muted,#64745d);margin:16px 0 8px}
.layout-examples .layout-branches{display:flex;flex-wrap:wrap;gap:5px;margin:20px 0 12px;border-bottom:1px solid var(--border,#d7dfd1);padding-bottom:8px}
.layout-examples button{font:inherit;font-size:12px;padding:7px 11px;border-radius:6px;border:1px solid var(--border,#c7d2c0);background:transparent;color:inherit;cursor:pointer}
.layout-examples button[aria-selected=true]{background:#2d4835;color:#fff;border-color:#2d4835}.layout-examples button:focus-visible{outline:2px solid #829d64;outline-offset:3px}
.layout-examples details{font-size:12px;margin:14px 0}.layout-examples summary{cursor:pointer}.layout-examples pre{font-size:11px;white-space:pre;overflow:auto;padding:14px;border-radius:6px;background:var(--surface,#f3f5ef)}
.layout-examples .layout-outcome{font-size:12px;color:var(--muted,#64745d)}@media(max-width:600px){.layout-examples .layout-example{padding:12px}.layout-examples button{padding:6px 8px}}
`}</style>
      {layoutExampleSets.map((set) => (
        <Example key={set.id} set={set} />
      ))}
    </div>
  );
}
