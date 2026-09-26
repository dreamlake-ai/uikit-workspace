import { useEffect, useState } from "react";
import {
  TabbedContainer,
  createLayoutController,
  createLayoutRegistry,
  type LayoutRegistry,
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
        background: "#f7f7f7",
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
                fill={artifact ? "#e6e6e6" : "#f0f0f0"}
                stroke="#b7b7b7"
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
                      fill={tab.active ? "#ffffff" : "#e4e4e4"}
                      stroke={tab.preview ? "#787878" : "none"}
                      strokeDasharray={tab.preview ? "3 2" : undefined}
                    />
                    <text
                      x={tx + 5}
                      y={y + 21}
                      fill="#303030"
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
                  fill="#303030"
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
                  fill="#777777"
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
    const global = window as Window & { dreamlakeLayouts?: LayoutRegistry };
    global.dreamlakeLayouts ??= createLayoutRegistry();
    const unregister = global.dreamlakeLayouts.register(
      `example-${set.id}`,
      {
        inspect: controller.inspect,
        resolve: controller.resolve,
        apply: async (request) => {
          const result = await controller.apply(request);
          if (alive) setState({ before, after: controller.inspect(), result });
          return result;
        },
      },
      set.title,
    );
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
      unregister();
    };
  }, [set, branch]);
  return (
    <section className="layout-example" id={`example-${set.id}`}>
      <h3>{set.title}</h3>
      <p>{set.description}</p>
      <p className="layout-caption">A · Shared starting layout</p>
      <Illustration
        snapshot={state.before}
        label={`${set.title}: starting layout`}
      />
      <TabbedContainer
        aria-label={`${set.title} command branches`}
        value={String(selected)}
        onValueChange={(value) => setSelected(Number(value))}
        keepMounted={false}
        className="layout-branches"
        items={set.branches.map((item, index) => ({
          value: String(index),
          label: item.title,
          children:
            index === selected ? (
              <>
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
              </>
            ) : null,
        }))}
      />
    </section>
  );
}
export function LayoutRequestsSpec() {
  return (
    <div className="layout-examples">
      <style>{`
.layout-examples .layout-example{border:1px solid var(--border,#dddddd);border-radius:12px;padding:22px;margin:28px 0;scroll-margin-top:80px}
.layout-examples h3{margin:0 0 8px}.layout-examples p{font-size:14px}.layout-examples .layout-caption{text-transform:uppercase;letter-spacing:.1em;font-size:10px;color:var(--muted,#727272);margin:16px 0 8px}
.layout-examples .layout-branches{margin:20px 0 12px}
.layout-examples details{font-size:12px;margin:14px 0}.layout-examples summary{cursor:pointer}.layout-examples pre{font-size:11px;white-space:pre;overflow:auto;padding:14px;border-radius:6px;background:var(--surface,#f2f2f2)}
.layout-examples .layout-outcome{font-size:12px;color:var(--muted,#727272)}@media(max-width:600px){.layout-examples .layout-example{padding:12px}}
`}</style>
      {layoutExampleSets.map((set) => (
        <Example key={set.id} set={set} />
      ))}
    </div>
  );
}
