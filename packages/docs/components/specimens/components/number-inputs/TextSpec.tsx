import { useState } from "react";
import { TextInput } from "@dreamlake/uikit";

export const TextSpec = () => {
  const [name, setName] = useState("camera_main");
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <TextInput
        size="sm"
        value={name}
        onChange={setName}
        prefix="@"
        placeholder="node name"
      />
      <p className="text-sm text-uikit-muted">
        Name: <code className="font-uikit-mono">{name || "(empty)"}</code>
      </p>
    </div>
  );
};
