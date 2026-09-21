import { useState } from "react";
import { Search } from "lucide-react";
import { InputRoot, InputSlot, Kbd } from "@dreamlake/uikit";

/** The app's ⌘K search field, composed from kit parts. */
export const SearchSpec = () => {
  const [query, setQuery] = useState("");
  return (
    <div style={{ width: 300 }}>
      <InputRoot
        type="search"
        value={query}
        placeholder="search"
        onChange={(e) => setQuery(e.target.value)}
      >
        <InputSlot side="left">
          <Search size={12} />
        </InputSlot>
        <InputSlot side="right" hideOnFocus>
          <Kbd>⌘K</Kbd>
        </InputSlot>
      </InputRoot>
    </div>
  );
};
