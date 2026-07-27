/**
 * Shared fixtures for the Workflow View specimens — the SAME schema-valid
 * examples the DreamLake product docs ship (perception pre-labeling with
 * routed human review, RLHF preference collection, teleop episode curation),
 * plus the per-family node fixtures. Kept in one place so every specimen
 * renders the identical data.
 */
import type {
  AgentInstance,
  ComputeNode,
  ControlNode,
  SamplerNode,
  UdaNode,
  WorkflowNodeRunStateValue,
  WorkflowSpec,
} from '@dreamlake/uikit'

// ── per-family node fixtures ─────────────────────────────────────────────────

export const COMPUTE: ComputeNode = {
  id: 'bimanual_filter', kind: 'compute', stageId: 's', title: 'bimanual_filter',
  compute: { udf: 'pipelines.bimanual_filter', provider: { launcher: 'SLURM', partition: 'xeon-g6-volta', dispatch: 'direct' } },
  outputs: [{ name: 'out', type: 'samples' }],
}

export const COMPUTE_2: ComputeNode = {
  ...COMPUTE, id: 'clip_transcode', title: 'clip_transcode',
  compute: { udf: 'media.transcode_clips', provider: { launcher: 'EC2', instance_type: 'g5.xlarge', dispatch: 'daemon' } },
}

export const UDA: UdaNode = {
  id: 'vlm_annotator', kind: 'uda', stageId: 's', title: 'vlm_annotator',
  uda: {
    instructions: 'Label task, sub-task and active hand for each clip',
    model: 'qwen-vl-72b',
    tools: ['Read'],
    permissions: ['dreamlake.datasets.read', 'dreamlake.datasets.create'],
    queue: 'gpu-a10g',
  },
  inputs: [{ name: 'in', type: 'samples' }],
  outputs: [{ name: 'out', type: 'dataset' }],
}

export const UDA_2: UdaNode = {
  ...UDA, id: 'episode_curator', title: 'episode_curator',
  uda: { ...UDA.uda, instructions: 'Drop episodes with broken calibration', model: 'claude-haiku', queue: undefined, provider: { launcher: 'SSH' } },
}

export const SAMPLERS: SamplerNode[] = [
  { id: 'sb', kind: 'sampler', stageId: 's', title: 'bernoulli_10pct', sampler: { strategy: 'bernoulli', fraction: 0.1, min_size: 50, seed: 42 } },
  { id: 'sr', kind: 'sampler', stageId: 's', title: 'random_500', sampler: { strategy: 'random_n', size: 500, seed: 7 } },
  { id: 'ss', kind: 'sampler', stageId: 's', title: 'per_episode', sampler: { strategy: 'stratified', stratify_by: 'episode', fraction: 0.3, seed: 7 } },
  { id: 'sf', kind: 'sampler', stageId: 's', title: 'head_100', sampler: { strategy: 'first_n', size: 100 } },
]

export const CONTROLS: ControlNode[] = [
  { id: 'c1', kind: 'control', stageId: 's', title: 'is_confident', control: { type: 'condition', expression: 'confidence >= 0.95' } },
  { id: 'c2', kind: 'control', stageId: 's', title: 'tier_switch', control: { type: 'switch', cases: [{ name: 'high', expression: 'c >= .75' }, { name: 'mid', expression: 'c >= .4' }, { name: 'low', expression: 'c < .4' }] } },
  { id: 'c3', kind: 'control', stageId: 's', title: 'retry_loop', control: { type: 'loop', mode: 'while', until: 'rework < 0.05', max_iterations: 3 } },
  { id: 'c4', kind: 'control', stageId: 's', title: 'qa_gate', control: { type: 'approval', message: 'Review before publish', timeout_s: 172800 } },
]

export const AGENTS: AgentInstance[] = [
  { agentId: 'a1', label: 'annotator-01', state: 'done', tokens: 48200, durationMs: 182000 },
  { agentId: 'a2', label: 'annotator-02', state: 'progress', tokens: 12100 },
  { agentId: 'a3', label: 'annotator-03', state: 'error', tokens: 3400, durationMs: 41000 },
]

export const RUN_STATES: WorkflowNodeRunStateValue[] = ['idle', 'queued', 'progress', 'done', 'error']

// ── hero: driving-scene annotation with confidence-routed human review ────────

export const DRIVING: WorkflowSpec = {
  version: 1,
  name: 'driving-scene-annotation',
  description:
    'Annotate driving clips: model pre-label, route by confidence to auto-accept, sampled human review, or expert review; merge, then release after sign-off.',
  stages: [
    { id: 'ingest', title: 'Ingest' },
    { id: 'triage', title: 'Triage' },
    { id: 'review', title: 'Review' },
    { id: 'release', title: 'Release' },
  ],
  nodes: [
    {
      id: 'clip_ingest', kind: 'compute', stageId: 'ingest', title: 'clip_ingest',
      compute: { udf: 'video.ingest_clips', params: { source: 'drive-cam-raw', since_days: 7 } },
      outputs: [{ name: 'out', type: 'samples' }],
    },
    {
      id: 'scene_prelabel', kind: 'compute', stageId: 'ingest', title: 'scene_prelabel',
      compute: {
        udf: 'perception.prelabel_objects',
        params: { model: 'grounding-dino-1.5', classes: ['vehicle', 'pedestrian', 'cyclist', 'traffic_light'] },
      },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'samples' }],
      execution: { retry: { max_attempts: 3, backoff: { initial: '10s', factor: 2, max: '5m' } }, timeout: '2h', cache: { enabled: true, version: '1' } },
    },
    {
      id: 'confidence_router', kind: 'control', stageId: 'triage', title: 'confidence_router',
      control: {
        type: 'switch',
        cases: [
          { name: 'high', expression: 'confidence >= 0.9' },
          { name: 'uncertain', expression: 'confidence >= 0.5' },
          { name: 'rare', expression: 'confidence < 0.5' },
        ],
      },
      inputs: [{ name: 'in', type: 'samples' }],
    },
    {
      id: 'auto_accept', kind: 'compute', stageId: 'triage', title: 'auto_accept',
      compute: { udf: 'labels.promote_prelabels', params: { require_confidence: 0.9 } },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'dataset' }],
    },
    {
      id: 'review_sample', kind: 'sampler', stageId: 'review', title: 'review_sample',
      sampler: { strategy: 'stratified', stratify_by: 'scene_type', fraction: 0.15, min_size: 50, seed: 11 },
      inputs: [{ name: 'in', type: 'samples' }],
    },
    {
      id: 'label_reviewer', kind: 'uda', stageId: 'review', title: 'label_reviewer',
      uda: {
        instructions:
          'Review each pre-labeled frame: verify boxes and classes, correct misses, and score occlusion and truncation. Reject frames with sensor artifacts.',
        model: 'qwen-vl-72b',
        tools: ['Read'],
        permissions: ['dreamlake.datasets.read', 'dreamlake.datasets.create'],
        queue: 'gpu-a10g',
        max_turns: 40,
      },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'dataset' }],
      execution: { retry: { max_attempts: 2 }, timeout: '4h' },
    },
    {
      id: 'expert_reviewer', kind: 'uda', stageId: 'review', title: 'expert_reviewer',
      uda: {
        instructions:
          'Fully annotate rare and low-confidence scenes: construction zones, emergency vehicles, unusual weather. Label from scratch — do not trust the pre-labels.',
        model: 'qwen-vl-72b',
        tools: ['Read'],
        permissions: ['dreamlake.datasets.read', 'dreamlake.datasets.create'],
        queue: 'gpu-h100',
      },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'dataset' }],
      execution: { retry: { max_attempts: 2 }, timeout: '8h' },
    },
    {
      id: 'label_merge', kind: 'compute', stageId: 'release', title: 'label_merge',
      compute: { udf: 'labels.merge_shards', params: { dedupe_on: 'clip_id' } },
      inputs: [{ name: 'in', type: 'dataset', collect: true }],
      outputs: [{ name: 'out', type: 'dataset' }],
    },
    {
      id: 'release_gate', kind: 'control', stageId: 'release', title: 'release_gate',
      control: { type: 'approval', message: 'Review class balance and QA metrics before release.', timeout_s: 172800 },
      inputs: [{ name: 'in', type: 'dataset' }],
    },
    {
      id: 'dataset_release', kind: 'compute', stageId: 'release', title: 'dataset_release',
      compute: { udf: 'datasets.publish_version' },
      inputs: [{ name: 'in', type: 'dataset' }],
      outputs: [{ name: 'out', type: 'dataset' }],
      outputBinding: { kind: 'dataset', project: 'workflows', pathTemplate: 'workflows/{workflow}/{runId}/{nodeId}' },
    },
  ],
  edges: [
    { id: 'e1', from: 'clip_ingest', to: 'scene_prelabel' },
    { id: 'e2', from: 'scene_prelabel', to: 'confidence_router' },
    { id: 'e3', from: 'confidence_router', fromPort: 'high', to: 'auto_accept' },
    { id: 'e4', from: 'confidence_router', fromPort: 'uncertain', to: 'review_sample' },
    { id: 'e5', from: 'review_sample', to: 'label_reviewer' },
    { id: 'e6', from: 'confidence_router', fromPort: 'rare', to: 'expert_reviewer' },
    { id: 'e7', from: 'confidence_router', fromPort: 'default', to: 'expert_reviewer' },
    { id: 'e8', from: 'auto_accept', to: 'label_merge' },
    { id: 'e9', from: 'label_reviewer', to: 'label_merge' },
    { id: 'e10', from: 'expert_reviewer', to: 'label_merge' },
    { id: 'e11', from: 'label_merge', to: 'release_gate' },
    { id: 'e12', from: 'release_gate', to: 'dataset_release' },
  ],
}

/** A run of DRIVING caught mid-flight — ingest/triage done, both review agents
 *  fanned out and working, release still queued. */
export const DRIVING_STATUS: Record<string, WorkflowNodeRunStateValue> = {
  clip_ingest: 'done',
  scene_prelabel: 'done',
  confidence_router: 'done',
  auto_accept: 'done',
  review_sample: 'done',
  label_reviewer: 'progress',
  expert_reviewer: 'progress',
  label_merge: 'queued',
  release_gate: 'queued',
  dataset_release: 'idle',
}

export const DRIVING_AGENTS: Record<string, AgentInstance[]> = {
  label_reviewer: [
    { agentId: 'r1', label: 'reviewer-1', state: 'done', tokens: 61200 },
    { agentId: 'r2', label: 'reviewer-2', state: 'progress', tokens: 23800 },
    { agentId: 'r3', label: 'reviewer-3', state: 'progress', tokens: 9400 },
  ],
  expert_reviewer: [
    { agentId: 'x1', label: 'expert-1', state: 'progress', tokens: 30100 },
    { agentId: 'x2', label: 'expert-2', state: 'queued' },
  ],
}

// ── RLHF preference collection ───────────────────────────────────────────────

export const RLHF: WorkflowSpec = {
  version: 1,
  name: 'rlhf-preference-set',
  description: 'Produce a pairwise-preference dataset for reward-model training.',
  stages: [
    { id: 'prompts', title: 'Prompts' },
    { id: 'generate', title: 'Generate' },
    { id: 'judge', title: 'Judge' },
    { id: 'release', title: 'Release' },
  ],
  nodes: [
    {
      id: 'prompt_ingest', kind: 'compute', stageId: 'prompts', title: 'prompt_ingest',
      compute: { udf: 'prompts.load_pool', params: { domains: ['coding', 'reasoning', 'writing'] } },
      outputs: [{ name: 'out', type: 'table' }],
    },
    {
      id: 'prompt_sample', kind: 'sampler', stageId: 'prompts', title: 'prompt_sample',
      sampler: { strategy: 'stratified', stratify_by: 'domain', fraction: 0.1, min_size: 200, seed: 3 },
      inputs: [{ name: 'in', type: 'table' }],
    },
    {
      id: 'pair_generator', kind: 'compute', stageId: 'generate', title: 'pair_generator',
      compute: { udf: 'policy.generate_response_pairs', params: { model: 'policy-7b', temperature: 0.9, pairs_per_prompt: 2 } },
      inputs: [{ name: 'in', type: 'table' }],
      outputs: [{ name: 'out', type: 'samples' }],
      execution: { retry: { max_attempts: 3 }, timeout: '6h', cache: { enabled: true, version: '2' } },
    },
    {
      id: 'preference_labeler', kind: 'uda', stageId: 'judge', title: 'preference_labeler',
      uda: {
        instructions:
          'For each response pair, choose the preferred response for helpfulness, correctness, and harmlessness. Mark ties explicitly and flag policy violations.',
        model: 'qwen-72b',
        tools: ['Read'],
        permissions: ['dreamlake.datasets.read', 'dreamlake.datasets.create'],
        queue: 'gpu-a10g',
      },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'dataset' }],
      execution: { retry: { max_attempts: 2 }, timeout: '8h' },
    },
    {
      id: 'agreement_gate', kind: 'control', stageId: 'judge', title: 'agreement_gate',
      control: { type: 'condition', expression: 'inter_rater_agreement >= 0.8' },
      inputs: [{ name: 'in', type: 'dataset' }],
    },
    {
      id: 'adjudicate', kind: 'compute', stageId: 'judge', title: 'adjudicate',
      compute: { udf: 'labels.queue_for_adjudication', params: { reason: 'low_agreement' } },
      inputs: [{ name: 'in', type: 'dataset' }],
      outputs: [{ name: 'out', type: 'dataset' }],
    },
    {
      id: 'release_gate', kind: 'control', stageId: 'release', title: 'release_gate',
      control: { type: 'approval', message: 'Check preference balance and violation flags before release.', timeout_s: 172800 },
      inputs: [{ name: 'in', type: 'dataset' }],
    },
    {
      id: 'publish', kind: 'compute', stageId: 'release', title: 'dataset_publish',
      compute: { udf: 'datasets.publish_version' },
      inputs: [{ name: 'in', type: 'dataset' }],
      outputs: [{ name: 'out', type: 'dataset' }],
    },
  ],
  edges: [
    { id: 'e1', from: 'prompt_ingest', to: 'prompt_sample' },
    { id: 'e2', from: 'prompt_sample', to: 'pair_generator' },
    { id: 'e3', from: 'pair_generator', to: 'preference_labeler' },
    { id: 'e4', from: 'preference_labeler', to: 'agreement_gate' },
    { id: 'e5', from: 'agreement_gate', fromPort: 'true', to: 'release_gate' },
    { id: 'e6', from: 'agreement_gate', fromPort: 'false', to: 'adjudicate' },
    { id: 'e7', from: 'adjudicate', to: 'release_gate' },
    { id: 'e8', from: 'release_gate', to: 'publish' },
  ],
}

// ── robot teleop episode curation ────────────────────────────────────────────

export const TELEOP: WorkflowSpec = {
  version: 1,
  name: 'teleop-episode-curation',
  description: 'Curate teleop episodes: filter, stratified-sample, agent-label, quality-route, publish.',
  stages: [
    { id: 'collect', title: 'Collect' },
    { id: 'sample', title: 'Sample' },
    { id: 'annotate', title: 'Annotate' },
    { id: 'publish', title: 'Publish' },
  ],
  nodes: [
    {
      id: 'episode_ingest', kind: 'compute', stageId: 'collect', title: 'episode_ingest',
      compute: { udf: 'teleop.list_episodes', params: { since_days: 30 } },
      outputs: [{ name: 'out', type: 'samples' }],
    },
    {
      id: 'quality_filter', kind: 'compute', stageId: 'collect', title: 'quality_filter',
      compute: { udf: 'teleop.filter_episodes', params: { min_duration_s: 5 } },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'samples' }],
    },
    {
      id: 'task_sample', kind: 'sampler', stageId: 'sample', title: 'task_sample',
      sampler: { strategy: 'stratified', stratify_by: 'task', fraction: 0.2, min_size: 25, seed: 7 },
      inputs: [{ name: 'in', type: 'samples' }],
    },
    {
      id: 'episode_labeler', kind: 'uda', stageId: 'annotate', title: 'episode_labeler',
      uda: {
        instructions: 'Label task, phase segments, success, and anomalies for each episode.',
        model: 'qwen-vl-72b', tools: ['Read'],
        permissions: ['dreamlake.datasets.read', 'dreamlake.datasets.create'],
        queue: 'gpu-a10g',
      },
      inputs: [{ name: 'in', type: 'samples' }],
      outputs: [{ name: 'out', type: 'dataset' }],
    },
    {
      id: 'release_gate', kind: 'control', stageId: 'publish', title: 'release_gate',
      control: { type: 'approval', message: 'Review labels before publishing.', timeout_s: 172800 },
      inputs: [{ name: 'in', type: 'dataset' }],
    },
    {
      id: 'publish_dataset', kind: 'compute', stageId: 'publish', title: 'dataset_publish',
      compute: { udf: 'datasets.publish_version' },
      inputs: [{ name: 'in', type: 'dataset' }],
      outputs: [{ name: 'out', type: 'dataset' }],
    },
  ],
  edges: [
    { id: 'e1', from: 'episode_ingest', to: 'quality_filter' },
    { id: 'e2', from: 'quality_filter', to: 'task_sample' },
    { id: 'e3', from: 'task_sample', to: 'episode_labeler' },
    { id: 'e4', from: 'episode_labeler', to: 'release_gate' },
    { id: 'e5', from: 'release_gate', to: 'publish_dataset' },
  ],
}

// ── mini blueprint (for the smaller live demo) ───────────────────────────────

export const MINI_SPEC: WorkflowSpec = {
  version: 1,
  name: 'mini',
  stages: [
    { id: 'collect', title: 'Collect' },
    { id: 'annotate', title: 'Annotate' },
  ],
  nodes: [
    {
      id: 'filter', kind: 'compute', stageId: 'collect', title: 'bimanual_filter',
      compute: { udf: 'pipelines.bimanual_filter', provider: { launcher: 'SLURM', partition: 'xeon-g6' } },
      outputs: [{ name: 'out', type: 'samples' }],
    },
    {
      id: 'sample', kind: 'sampler', stageId: 'collect', title: 'take_sample',
      sampler: { strategy: 'bernoulli', fraction: 0.1, min_size: 50, seed: 42 },
      inputs: [{ name: 'in', type: 'samples' }], outputs: [{ name: 'out', type: 'samples' }],
    },
    {
      id: 'vlm', kind: 'uda', stageId: 'annotate', title: 'vlm_annotator',
      uda: { instructions: 'Label each clip', model: 'qwen-vl-72b', permissions: ['dreamlake.datasets.read'], queue: 'gpu-a10g' },
      inputs: [{ name: 'in', type: 'samples' }], outputs: [{ name: 'out', type: 'dataset' }],
    },
  ],
  edges: [
    { id: 'e1', from: 'filter', to: 'sample' },
    { id: 'e2', from: 'sample', to: 'vlm' },
  ],
}

export const MINI_STATUS: Record<string, WorkflowNodeRunStateValue> = { filter: 'done', sample: 'done', vlm: 'progress' }

export const MINI_AGENTS: Record<string, AgentInstance[]> = {
  vlm: [
    { agentId: 'a1', label: 'annotator-01', state: 'done', tokens: 48200 },
    { agentId: 'a2', label: 'annotator-02', state: 'progress', tokens: 12100 },
  ],
}
