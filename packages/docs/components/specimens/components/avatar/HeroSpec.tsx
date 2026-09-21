import { AvatarHero } from "@dreamlake/uikit";

export const HeroSpec = () => (
  <div
    style={{
      display: "flex",
      gap: 24,
      alignItems: "flex-start",
      flexWrap: "wrap",
    }}
  >
    <div style={{ width: 200 }}>
      <AvatarHero name="Ge Yang" />
    </div>
    <div style={{ width: 200 }}>
      <AvatarHero name="dreamlake" editable onEdit={() => {}} />
    </div>
  </div>
);
