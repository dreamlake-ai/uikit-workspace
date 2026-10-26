# Monaco CodeBlock migration

Captured at 1440×1000 using the first `greet.ts` specimen on `/components/code-block`.
`before.png` is the deployed documentation at https://uikit.dreamlake.ai; the CodeBlock
implementation on the upstream main branch is the same retired implementation.
`after.png` is the local branch documentation with Monaco and the retained UIKit surface.
Both images clip the same specimen. The 1.25px height difference comes from Monaco's
integer line-height metrics. Syntax colors now use Monaco's built-in themes.

Validation: 428 UIKit unit tests, typecheck, library and documentation builds;
real-browser app coverage for editing, read-only updates, retained models, theme
changes and disposal. The static library entry and shared chunk do not import Monaco;
only the lazy kernel chunk imports the editor and tokenizer registry.
