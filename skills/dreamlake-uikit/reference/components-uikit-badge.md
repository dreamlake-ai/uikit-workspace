# UIKit Badge

A small two-chip badge that shows the kit's package name and version —
`[ uikit | v0.1.6 ]` — handy in galleries, footers, and dev tools. The version
reflects the installed package; when consumed from source it shows as `dev`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `package` | `boolean` | `false` | Show the short package-name chip. |
| `version` | `boolean` | `false` | Show the version chip. |
| `prefix` | `boolean` | `false` | Prefix the version with `v`. |
| `hash` | `boolean` | `false` | Show the git-hash chip. No git hash is currently injected, so this chip does not render. |
| `linkable` | `boolean` | `false` | Link the chips to npm / GitHub. |
| `className` | `string` | — | Extra classes. |

The lower-level `PackageBadge` (fully prop-driven) and the `PACKAGE_NAME` /
`PACKAGE_VERSION` constants are also exported.
