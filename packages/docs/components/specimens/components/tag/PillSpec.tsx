import { useState } from "react";
import { Tag } from "@dreamlake/uikit";

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
  >
    <span
      style={{
        width: 84,
        flexShrink: 0,
        fontFamily: "var(--f-mono)",
        fontSize: 9,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--uikit-muted)",
        opacity: 0.7,
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

/** The four shapes the app actually renders — every one of them `compact`. */
export const PillSpec = () => {
  const [tags, setTags] = useState([
    "vision-model",
    "q3-curated",
    "imagenet-1M",
  ]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Row label="kind">
        <Tag name="notebook" variant="pill" compact />
      </Row>
      <Row label="status">
        <Tag name="running" variant="pill" tone="blue" compact light />
        <Tag name="passed" variant="pill" tone="green" compact light />
        <Tag name="failed" variant="pill" tone="red" compact light />
        <Tag name="queued" variant="pill" tone="warmGray" compact light />
      </Row>
      <Row label="role">
        <Tag name="maintainer" variant="pill" tone="blue" compact />
        <Tag name="member" variant="pill" tone="warmGray" compact />
      </Row>
      <Row label="editable">
        {tags.map((t) => (
          <Tag
            key={t}
            name={t}
            variant="pill"
            compact
            removable
            onRemove={() => setTags((prev) => prev.filter((x) => x !== t))}
          />
        ))}
      </Row>
    </div>
  );
};
