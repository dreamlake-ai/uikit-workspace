import { Avatar } from "@dreamlake/uikit";

/** The three radii the app actually draws: rows, the presence stack, the hero. */
export const ShapesSpec = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Avatar name="Ge Yang" size={40} radius={4} />
    <Avatar name="Pulkit A" size={40} radius={6} />
    <Avatar name="Josh T" size={40} radius={12} />
  </div>
);
