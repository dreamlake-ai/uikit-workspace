import { useIsMobile } from '@dreamlake/uikit'

export const BasicSpec = () => {
  const isMobile = useIsMobile()
  return (
    <div className="text-uikit-12 text-uikit-ink">
      Viewport is{' '}
      <strong>{isMobile ? 'mobile (< 768px)' : 'desktop (≥ 768px)'}</strong>. Resize the window to
      see it update.
    </div>
  )
}
