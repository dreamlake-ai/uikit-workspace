import { useState } from "react";
import { ChipMulti, PillRadio, type PillOption } from "@dreamlake/uikit";

const ROLES: PillOption[] = [
  { value: "owner", label: "owner" },
  { value: "admin", label: "admin" },
  { value: "member", label: "member" },
  { value: "viewer", label: "viewer" },
  { value: "billing", label: "billing", disabled: true },
];

const TEAMS: PillOption[] = [
  { value: "perception", label: "perception" },
  { value: "manipulation", label: "manipulation" },
  { value: "fleet-ops", label: "fleet ops" },
  { value: "data-platform", label: "data platform" },
];

export const PillSelectSpec = () => {
  const [role, setRole] = useState("member");
  const [teams, setTeams] = useState<string[]>(["perception", "fleet-ops"]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        maxWidth: 420,
      }}
    >
      <Field label="role">
        <PillRadio value={role} onValueChange={setRole} options={ROLES} />
      </Field>
      <Field label="add to teams">
        <ChipMulti value={teams} onValueChange={setTeams} options={TEAMS} />
      </Field>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 9,
        color: "var(--uikit-muted)",
        opacity: 0.6,
        letterSpacing: ".14em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
    {children}
  </div>
);
