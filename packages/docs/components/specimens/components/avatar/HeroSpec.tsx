import { AvatarHero } from "@dreamlake/uikit";

/** Three widths, all editable, to show two things at once: the initials size
 *  off the box rather than a literal, and the hover overlay drops its label
 *  once the square is too narrow to hold it on one line. 248px is the app's
 *  profile rail — the width the design was drawn at. */
export const HeroSpec = () => (
  <div
    style={{
      display: "flex",
      gap: 20,
      alignItems: "flex-end",
      flexWrap: "wrap",
    }}
  >
    <Rail width={168}>
      <AvatarHero name="Ge Yang" editable onEdit={() => {}} />
    </Rail>
    <Rail width={112}>
      <AvatarHero name="dreamlake" editable onEdit={() => {}} />
    </Rail>
    <Rail width={64}>
      <AvatarHero name="perception team" editable onEdit={() => {}} />
    </Rail>
  </div>
);

const Rail = ({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, width }}>
    {children}
    <span
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 9,
        letterSpacing: ".1em",
        textTransform: "uppercase",
        color: "var(--uikit-muted)",
      }}
    >
      {width}px
    </span>
  </div>
);
