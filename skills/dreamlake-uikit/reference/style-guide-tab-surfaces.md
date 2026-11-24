# Tab surfaces

A selected tab belongs to the content below it. Its base fill, including its curved feet, must match that content. Choose the surface from the **active view**, even when the tab title stays the same.

## Names and tokens

UIKit calls background colors **surfaces**. A document or file preview normally sits on the **document surface** (`--bg`). A component using the **panel surface** (`--panel-bg`) keeps that token for its tab too. Terminals and chats sit on the **workspace background** (`--uikit-workspace-bg`). These are surface choices for the shared tab primitives, not different tab components.

| Style                | Content fill           | Selected tab                                              |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Document             | `--bg`                 | Solid matching fill                                       |
| Panel                | `--panel-bg`           | Solid matching fill                                       |
| Workspace background | `--uikit-workspace-bg` | Matching base, subtle selection gradient and outline      |
| List heading         | Usually `--bg`         | Matching `DocumentTabHeading`; no tab-selection semantics |

The tab strip remains on the workspace background. Set `--uikit-document-surface` to the content fill. Do not assume that a UI “panel” uses `--panel-bg`: document panels use `--bg`. In dark mode `--panel-bg` and `--bg` can be the same color; their semantic roles remain distinct. See [Color](reference/style-guide-color.md) for the full surface stack.

## Compare the styles

Use the site theme switcher to compare light and dark. Each example uses the same UIKit primitives, keeps its width stable, and retains drafts when you switch tabs.

## One tab, different content surfaces

Switch **Terminal → Files** below. The tab title stays “My computer”, while its selected face and content change together. Files uses the solid document surface. Returning to Terminal restores the workspace surface and the retained terminal draft. Loading, empty and error states should use the same surface as the view they belong to.

## Apply the contract

Set `--uikit-document-surface` on the shared owner of the tab row and content, and paint the body with that variable. When the active view changes, change both together. Keep this choice local to the owning panel so hidden retained views cannot recolor another tab. Use a solid face for document and panel surfaces; reserve the workspace selection treatment for content on the workspace ground.

The first tab aligns with its panel's left edge. Contextual actions stay at the right of the tab row. Do not add a top border around the content. The tab primitives continue to own the curved feet, focus, overflow and keyboard navigation.

See [Panel tabs](reference/components-panel-tabs.md) for composition and [Tab Row](reference/components-tab-row.md) for API details.
