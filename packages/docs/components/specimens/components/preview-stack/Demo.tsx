import { useState } from "react";
import { PreviewStack } from "@dreamlake/uikit";

function Scene({ variation }: { variation: number }) {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <rect width="320" height="200" fill="#cbd0d1" />
      <path d="M0 122 154 55 320 124 170 200Z" fill="#8e989d" />
      <path d="m55 120 104-45 103 43-101 47Z" fill="#e1ded7" />
      <path d="m55 120 106 45v10L55 130Z" fill="#a8a69f" />
      <path d="m161 165 101-47v10l-101 47Z" fill="#b9b6ae" />
      <ellipse
        cx={132 + variation * 14}
        cy="113"
        rx="24"
        ry="10"
        fill="#fafafa"
      />
      <ellipse
        cx={132 + variation * 14}
        cy="113"
        rx="16"
        ry="6"
        fill="#c9ccce"
      />
      <path
        d="m222 127-12-28-26-11 5-23"
        fill="none"
        stroke="#50575d"
        strokeWidth="13"
        strokeLinejoin="round"
      />
      <circle cx="210" cy="99" r="8" fill="#919a9f" />
      <rect x="212" y="126" width="24" height="9" rx="3" fill="#424b52" />
    </svg>
  );
}

export function Demo() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <section aria-label="Preview stack example">
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
          gap: 20,
        }}
      >
        {[
          "Load plates into dish rack",
          "Pick up the mug",
          "Single environment",
        ].map((title, index) => (
          <button
            type="button"
            key={title}
            onClick={() => setOpened(title)}
            style={{
              padding: 0,
              border: 0,
              background: "none",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <PreviewStack
              previews={Array.from(
                { length: index === 2 ? 1 : 3 },
                (_, variation) => (
                  <Scene key={variation} variation={variation + index} />
                ),
              )}
            />
            <span style={{ display: "block", marginTop: 8, fontSize: 13 }}>
              {title}
            </span>
            <span style={{ display: "block", opacity: 0.55, fontSize: 12 }}>
              {index === 2 ? "1 environment" : "198 episodes"}
            </span>
          </button>
        ))}
      </div>
      <output aria-live="polite" style={{ display: "block", marginTop: 16 }}>
        {opened ? `Opened: ${opened}` : "Choose a collection"}
      </output>
    </section>
  );
}
