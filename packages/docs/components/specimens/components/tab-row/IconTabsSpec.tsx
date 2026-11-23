import { useState } from "react";
import { List, Menu } from "lucide-react";
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
