import { Avatar } from '@dreamlake/uikit'

// A valid inline image, a broken URL (falls back to initials), and no image.
const SAMPLE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%232174d9"/><circle cx="20" cy="15" r="7" fill="white"/><rect x="6" y="26" width="28" height="14" rx="7" fill="white"/></svg>'

export const ImageSpec = () => (
  <div className="flex items-center gap-3.5">
    <Avatar name="Ge Yang" image={SAMPLE} size={40} />
    <Avatar name="Ge Yang" image="/missing.png" size={40} />
    <Avatar name="MIT CSAIL" size={40} />
  </div>
)
