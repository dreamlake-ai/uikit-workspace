import { Tag } from '@dreamlake/uikit'

export const AccentSpec = () => (
  <div className="flex flex-wrap items-center gap-3.5">
    <Tag name="dreamlake" />
    <Tag name="dreamlake" active />
    <Tag name="experiment-v2" accent="green" active />
    <Tag name="failed-runs"   accent="red" active />
    <Tag name="brand-tag"     accent="#ff6b35" active />
  </div>
)
