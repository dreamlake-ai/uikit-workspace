import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import { ChipMulti, PillRadio, type PillOption } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

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

const VISIBILITY: PillOption[] = [
  { value: "private", label: "private", icon: <Lock size={11} /> },
  { value: "public", label: "public", icon: <Globe size={11} /> },
];

export const PillSelectSpec = () => {
  const [visibility, setVisibility] = useState("private");
  const [role, setRole] = useState("member");
  const [teams, setTeams] = useState<string[]>(["perception", "fleet-ops"]);

  return (
    <ShapePair>
      {(shape) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 300,
          }}
        >
          <Field label="visibility">
            <PillRadio
              shape={shape}
              value={visibility}
              onValueChange={setVisibility}
              options={VISIBILITY}
            />
          </Field>
          <Field label="role">
            <PillRadio
              shape={shape}
              value={role}
              onValueChange={setRole}
              options={ROLES}
            />
          </Field>
          <Field label="add to teams">
            <ChipMulti
              shape={shape}
              value={teams}
              onValueChange={setTeams}
              options={TEAMS}
            />
          </Field>
        </div>
      )}
    </ShapePair>
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
