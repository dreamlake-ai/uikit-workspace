import { Button } from "@dreamlake/uikit";

export const VariantsSpec = () => (
  <div
    style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}
  >
    <Button variant="primary">create team</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">cancel</Button>
    <Button variant="danger">delete permanently</Button>
  </div>
);
