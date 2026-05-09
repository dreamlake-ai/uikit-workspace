import {
  Callout,
  CodeBlock,
  Com,
  Crumbs,
  Fn,
  H2,
  In,
  Kw,
  Lede,
  Num,
  Str,
  Tag,
} from '../../src/components/prose'

// Descendant variants on the doc-content wrapper style raw HTML elements
// (h1, h3, p, ul, ol, li, code, table, th, td) so Page.tsx prose stays
// readable. The chrome primitives (H2, Lede, Crumbs, CodeBlock, Callout,
// In) carry their own utilities.
const docContentCx = [
  'doc-content min-w-0 max-w-[760px] px-14 pb-[120px] max-[1100px]:max-w-full max-[880px]:px-[18px] max-[880px]:pt-6 max-[880px]:pb-20',
  '[&>h1]:font-ui [&>h1]:text-[32px] [&>h1]:font-bold [&>h1]:tracking-[-0.025em] [&>h1]:[margin:18px_0_10px] [&>h1]:text-ink [&>h1]:leading-[1.1]',
  '[&>h3]:font-ui [&>h3]:text-[15px] [&>h3]:font-semibold [&>h3]:tracking-[-0.005em] [&>h3]:mt-7 [&>h3]:mb-2 [&>h3]:text-ink [&>h3]:[scroll-margin-top:124px]',
  '[&>p]:font-ui [&>p]:text-[14.5px] [&>p]:leading-[1.65] [&>p]:text-ink [&>p]:m-0 [&>p]:mb-3.5 [&>p]:[text-wrap:pretty]',
  '[&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.88em] [&_:not(pre)>code]:bg-chip [&_:not(pre)>code]:text-ink [&_:not(pre)>code]:py-px [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:border [&_:not(pre)>code]:border-faint [&_:not(pre)>code]:tracking-[-0.005em]',
  '[&>ol]:font-ui [&>ol]:text-[14.5px] [&>ol]:leading-[1.65] [&>ol]:text-ink [&>ol]:m-0 [&>ol]:mb-3.5 [&>ol]:pl-[22px]',
  '[&>ul]:font-ui [&>ul]:text-[14.5px] [&>ul]:leading-[1.65] [&>ul]:text-ink [&>ul]:m-0 [&>ul]:mb-3.5 [&>ul]:pl-[22px]',
  '[&_li]:mb-1 [&_li::marker]:text-muted',
  '[&>table]:w-full [&>table]:border-collapse [&>table]:font-ui [&>table]:text-[13px] [&>table]:[margin:14px_0_22px]',
  '[&_thead_th]:text-left [&_thead_th]:font-mono [&_thead_th]:text-[10px] [&_thead_th]:font-semibold [&_thead_th]:text-muted [&_thead_th]:tracking-[0.12em] [&_thead_th]:uppercase [&_thead_th]:py-2 [&_thead_th]:px-3 [&_thead_th]:border-b [&_thead_th]:border-faint [&_thead_th]:bg-[color-mix(in_srgb,var(--color-ink)_2%,var(--color-bg))]',
  '[&_tbody_td]:py-[9px] [&_tbody_td]:px-3 [&_tbody_td]:border-b [&_tbody_td]:border-faint [&_tbody_td]:text-ink [&_tbody_td]:align-top [&_tbody_td]:leading-[1.5]',
  '[&_tbody_tr:last-child_td]:border-b-0',
  '[&_tbody_td_code]:font-mono [&_tbody_td_code]:text-xs',
].join(' ')

export default function Page() {
  return (
    <main className={docContentCx}>
      <Crumbs trail={[{ href: '/', label: '@dreamlake/uikit' }]} here="Quick start" />

      <h1>Quick start</h1>
      <Lede>
        <code>@dreamlake/ros-viz</code> is the visualization library for robotics data — point clouds, TF
        trees, occupancy grids, and image streams, rendered in the browser from a live ROS bridge or a
        recorded bag. This page gets your first scene on screen in under two minutes.
      </Lede>

      <H2 id="install">Install</H2>
      <p>
        Add <code>ros-viz</code> to any modern bundler. The package ships ESM and a CDN build — both
        are tree-shakeable down to just the renderers you actually use.
      </p>

      <CodeBlock lang="bash" file="terminal">
        <Com># npm</Com>
        {`\nnpm install @dreamlake/ros-viz\n\n`}
        <Com># or pnpm</Com>
        {`\npnpm add @dreamlake/ros-viz`}
      </CodeBlock>

      <H2 id="first-scene">Your first scene</H2>
      <p>
        A <code>Scene</code> binds a transport (rosbridge, foxglove ws, or a local <code>.bag</code>/
        <code>.mcap</code> file) to a set of <code>Layer</code> objects. Layers subscribe to topics and
        own their own GPU buffers — you can mount them in any order and toggle visibility independently.
      </p>

      <CodeBlock lang="typescript" file="scene.ts">
        <Kw>import</Kw>
        {' { Scene, PointCloud, TFTree, Grid } '}
        <Kw>from</Kw> <Str>"@dreamlake/ros-viz"</Str>;{`\n\n`}
        <Kw>const</Kw>
        {' scene = '}
        <Kw>new</Kw> <Fn>Scene</Fn>({'({\n  canvas: '}
        <Fn>document</Fn>.<Fn>querySelector</Fn>(<Str>"#viewport"</Str>),
        {`\n  transport: { kind: `}<Str>"rosbridge"</Str>{`, url: `}<Str>"ws://robot.local:9090"</Str>{` },\n  fixedFrame: `}<Str>"map"</Str>{`,\n});\n\n`}
        scene.<Fn>add</Fn>(<Kw>new</Kw> <Fn>TFTree</Fn>{'());\n'}
        scene.<Fn>add</Fn>(<Kw>new</Kw> <Fn>Grid</Fn>{'({ size: '}<Num>20</Num>{', divisions: '}<Num>20</Num>{' }));\n'}
        scene.<Fn>add</Fn>(<Kw>new</Kw> <Fn>PointCloud</Fn>{'({ topic: '}<Str>"/velodyne_points"</Str>{', colorBy: '}<Str>"z"</Str>{' }));\n\n'}
        <Kw>await</Kw> scene.<Fn>start</Fn>();
      </CodeBlock>

      <h3 id="markup">HTML scaffold</h3>
      <p>
        The renderer needs a sized canvas and nothing else. <code>Scene</code> will observe the canvas
        and adopt its CSS pixel size, including DPR.
      </p>

      <CodeBlock lang="html" file="index.html">
        <Tag>{'<canvas'}</Tag>
        {' '}
        <Fn>id</Fn>=<Str>"viewport"</Str>{' '}
        <Fn>style</Fn>=<Str>"width: 100%; height: 100vh"</Str>
        <Tag>{'></canvas>'}</Tag>
        {`\n`}
        <Tag>{'<script'}</Tag>
        {' '}
        <Fn>type</Fn>=<Str>"module"</Str>{' '}
        <Fn>src</Fn>=<Str>"./scene.ts"</Str>
        <Tag>{'></script>'}</Tag>
      </CodeBlock>

      <Callout type="info">
        <strong>WebGPU is preferred, WebGL2 is the fallback.</strong>
        On Chromium-based browsers ros-viz uses WebGPU automatically; on Safari and Firefox it falls
        back to WebGL2 with the same scene graph. Performance differences are documented per-layer.
      </Callout>

      <H2 id="from-bag">Replay a recorded bag</H2>
      <p>
        Swap the transport for <code>kind: "file"</code> to play back a <code>.bag</code> or{' '}
        <code>.mcap</code> from disk — same scene, same layers, no live robot required. The clock
        becomes scrubbable via <code>scene.clock</code>.
      </p>

      <CodeBlock lang="typescript" file="replay.ts">
        <Kw>const</Kw>
        {' file = '}
        <Kw>await</Kw> <Fn>fetch</Fn>(<Str>"/runs/2026-04-30.mcap"</Str>).<Fn>then</Fn>{'(r => r.'}
        <Fn>blob</Fn>{'());\n\n'}
        <Kw>const</Kw>
        {' scene = '}
        <Kw>new</Kw> <Fn>Scene</Fn>{'({\n  canvas, fixedFrame: '}<Str>"odom"</Str>{`,\n  transport: { kind: `}<Str>"file"</Str>{`, source: file },\n});\n\n`}
        scene.clock.<Fn>on</Fn>(<Str>"tick"</Str>{', t => '}<Fn>console</Fn>.<Fn>log</Fn>(t.toFixed(<Num>3</Num>{')));\n'}
        <Kw>await</Kw> scene.<Fn>start</Fn>{'();\n'}
        scene.clock.<Fn>play</Fn>(<Num>1.0</Num>{'); '}
        <Com>{'// 1× speed'}</Com>
      </CodeBlock>

      <H2 id="layers">Built-in layers</H2>
      <p>
        Every layer is a small class with a topic, a message type, and render options. You can subclass{' '}
        <code>Layer</code> for anything custom; below is the catalog that ships in the box.
      </p>

      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Message type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>PointCloud</code></td>
            <td><code>sensor_msgs/PointCloud2</code></td>
            <td>Color by axis, intensity, or RGB field.</td>
          </tr>
          <tr>
            <td><code>TFTree</code></td>
            <td><code>tf2_msgs/TFMessage</code></td>
            <td>Renders frame axes; doubles as the transform graph.</td>
          </tr>
          <tr>
            <td><code>Grid</code></td>
            <td>—</td>
            <td>Static reference grid, anchored to <code>fixedFrame</code>.</td>
          </tr>
          <tr>
            <td><code>OccupancyGrid</code></td>
            <td><code>nav_msgs/OccupancyGrid</code></td>
            <td>2D costmaps and SLAM output.</td>
          </tr>
          <tr>
            <td><code>Image</code></td>
            <td><code>sensor_msgs/Image</code></td>
            <td>Decodes on a worker; supports compressed variants.</td>
          </tr>
          <tr>
            <td><code>MarkerArray</code></td>
            <td><code>visualization_msgs/MarkerArray</code></td>
            <td>Cubes, spheres, lines, text — rviz-compatible.</td>
          </tr>
        </tbody>
      </table>

      <H2 id="react">React binding</H2>
      <p>
        Prefer JSX? <code>@dreamlake/ros-viz/react</code> exposes the same primitives as components.
        Layer order in JSX is render order; toggle visibility by mounting/unmounting.
      </p>

      <CodeBlock lang="tsx" file="App.tsx">
        <Kw>import</Kw>
        {' { Scene, PointCloud, TFTree, Grid } '}
        <Kw>from</Kw> <Str>"@dreamlake/ros-viz/react"</Str>;{`\n\n`}
        <Kw>export function</Kw> <Fn>App</Fn>{'() {\n  '}
        <Kw>return</Kw>
        {' (\n    '}
        <Tag>{'<Scene'}</Tag>
        {`\n      `}
        <Fn>transport</Fn>{'={{ kind: '}<Str>"rosbridge"</Str>{', url: '}<Str>"ws://robot.local:9090"</Str>{' }}\n      '}
        <Fn>fixedFrame</Fn>=<Str>"map"</Str>
        {`\n    `}
        <Tag>{'>'}</Tag>
        {`\n      `}
        <Tag>{'<TFTree />'}</Tag>
        {`\n      `}
        <Tag>{'<Grid'}</Tag>{' '}
        <Fn>size</Fn>{'={'}<Num>20</Num>{'} '}
        <Fn>divisions</Fn>{'={'}<Num>20</Num>{'} '}
        <Tag>{'/>'}</Tag>
        {`\n      `}
        <Tag>{'<PointCloud'}</Tag>{' '}
        <Fn>topic</Fn>=<Str>"/velodyne_points"</Str>{' '}
        <Fn>colorBy</Fn>=<Str>"z"</Str>{' '}
        <Tag>{'/>'}</Tag>
        {`\n    `}
        <Tag>{'</Scene>'}</Tag>
        {`\n  );\n}`}
      </CodeBlock>

      <Callout type="warn">
        <strong>Strict Mode mounts twice.</strong>
        In React 18 dev with Strict Mode the <code>Scene</code> component will create &amp; tear down a
        transport on first mount. This is expected; production builds run a single mount.
      </Callout>

      <H2 id="next">Where to go next</H2>
      <ol>
        <li>
          Skim the <In href="#layers">layer catalog</In> — one section per layer, with full options
          and message-field mapping.
        </li>
        <li>
          Wire up authoring &amp; deeplinking via <code>scene.serialize()</code> for sharable
          snapshots.
        </li>
        <li>
          Drop a <code>{'<Timeline />'}</code> next to your viewport for scrubbing across recorded
          segments.
        </li>
      </ol>
    </main>
  )
}
