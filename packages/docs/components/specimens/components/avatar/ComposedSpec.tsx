import { Avatar, AvatarImage, AvatarFallback } from '@dreamlake/uikit'

export const ComposedSpec = () => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    {/* Image loads → shown */}
    <Avatar size={40}>
      <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="Ada" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
    {/* Broken URL → fallback initials */}
    <Avatar size={40}>
      <AvatarImage src="https://example.invalid/nope.png" alt="Grace" />
      <AvatarFallback>GH</AvatarFallback>
    </Avatar>
    {/* No image → fallback only */}
    <Avatar size={40}>
      <AvatarFallback>MC</AvatarFallback>
    </Avatar>
  </div>
)
