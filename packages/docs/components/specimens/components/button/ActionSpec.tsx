import { Button } from "@dreamlake/uikit";

export const ActionSpec = () => (
  <div
    style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}
  >
    <Button variant="action" tone="muted" leftIcon={<Chevron />}>
      back
    </Button>
    <span style={{ width: 1, height: 14, background: "var(--faint)" }} />
    <Button variant="action">+ publish</Button>
    <Button variant="action">+ import</Button>
    <Button variant="action" value>
      editing
    </Button>
    <Button variant="action" value href="#">
      open in lake ↗
    </Button>
    <Button variant="action" tone="danger">
      delete
    </Button>
    <Button variant="action" disabled>
      archive
    </Button>
  </div>
);

const Chevron = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
