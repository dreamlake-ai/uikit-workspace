import { ProfileCard } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div className="w-full max-w-xl">
    <ProfileCard
      title="train-yolo"
      tag="trainer"
      titleRight="v12 · 3 days ago"
      description="End-to-end training pipeline with automatic hyperparameter search and multi-GPU support."
      footer={
        <span>8 nodes · 14 comments · <span className="text-uikit-accent">#vision-model</span></span>
      }
      onClick={() => {}}
    />
  </div>
)
