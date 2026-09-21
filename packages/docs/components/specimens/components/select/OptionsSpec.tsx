import { useState } from "react";
import { Select, type SelectOption } from "@dreamlake/uikit";

const ROLES: SelectOption[] = [
  { value: "owner", label: "owner" },
  { value: "admin", label: "admin" },
  { value: "member", label: "member" },
  { value: "viewer", label: "viewer" },
  { value: "billing", label: "billing", disabled: true },
];

export const OptionsSpec = () => {
  const [role, setRole] = useState("member");
  return (
    <Select
      value={role}
      onValueChange={setRole}
      options={ROLES}
      placeholder="pick a role"
    />
  );
};
