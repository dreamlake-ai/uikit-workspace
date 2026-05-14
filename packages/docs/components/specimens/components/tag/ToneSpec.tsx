import { Tag } from '@dreamlake/uikit'

export const ToneSpec = () => (
  <div className="flex flex-col gap-3.5 items-start">
    <div className="flex flex-wrap items-baseline gap-[18px]">
      <Tag name="running" tone="blue" />
      <Tag name="passed"  tone="green" />
      <Tag name="stale"   tone="amber" />
      <Tag name="failed"  tone="red" />
      <Tag name="merged"  tone="purple" />
      <Tag name="queued"  tone="warmGray" />
    </div>
    <div className="flex flex-wrap items-center gap-3.5">
      <Tag name="experiment-v2" tone="green" active />
      <Tag name="failed-runs"   tone="red" active />
      <Tag name="needs-review"  tone="amber" />
    </div>
  </div>
)
