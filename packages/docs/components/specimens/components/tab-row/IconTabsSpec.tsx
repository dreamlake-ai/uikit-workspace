import { useState } from "react";
import { List, Menu, FileText } from "lucide-react";
import { Button, TabRow } from "@dreamlake/uikit";

export function IconTabsSpec() {
  const [value, setValue] = useState("content");
  const [navigation, setNavigation] = useState(false);
  return (
    <div className="max-w-sm bg-uikit-workspace" data-tab-row-example="icons">
      <TabRow
        value={value}
        onValueChange={setValue}
        aria-label="Workspace panels"
        className="uikit-tab-row-compact"
        minTabHeight={30}
        leading={
          <Button
            variant="action"
            tone="muted"
            icon
            size="md"
            className="uikit-document-tab-action"
            aria-label="Menu"
            aria-expanded={navigation}
            onClick={() => setNavigation(!navigation)}
          >
            <Menu size={14} />
          </Button>
        }
        tabs={[
          {
            value: "list",
            label: "List",
            icon: <List size={14} />,
            iconOnly: true,
          },
          { value: "content", label: "Content" },
        ]}
      />
      <div
        data-tab-row-body=""
        className="bg-uikit-bg p-4 text-sm text-uikit-muted"
      >
        {navigation
          ? "Navigation is open."
          : value === "list"
            ? "Select an item from the list."
            : "Selected item content."}
      </div>
    </div>
  );
}

export function LeadingIconsSpec() {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("ready");
  return (
    <div data-leading-icons-example="" className="bg-uikit-workspace">
      <TabRow
        aria-label="Leading icon states"
        value={value}
        onValueChange={setValue}
        tabs={[
          {
            value: "ready",
            label: "Ready",
            icon: <FileText size={14} />,
            fitContent: true,
          },
          {
            value: "pending",
            label: "Loading icon",
            iconLoading: !loaded,
            icon: loaded ? <FileText size={14} /> : undefined,
            fitContent: true,
          },
          { value: "text", label: "Text only", fitContent: true },
          {
            value: "trailing",
            label: "Trailing icon",
            labelContent: (
              <span>
                Trailing icon <FileText size={14} className="inline" />
              </span>
            ),
            fitContent: true,
          },
        ]}
      />
      <div className="p-3 text-sm text-uikit-muted">
        <Button variant="ghost" size="sm" onClick={() => setLoaded(!loaded)}>
          {loaded ? "Unload icon" : "Load pending icon"}
        </Button>
        <p>
          Empty icon slots collapse; the compact leading inset stays unchanged.
        </p>
      </div>
    </div>
  );
}
