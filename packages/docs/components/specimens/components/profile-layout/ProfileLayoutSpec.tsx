import { useRef, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import {
  ProfileLayout,
  ProfileCard,
  FilterBar,
  TOPBAR_H_SMALL,
  type ProfileLayoutTab,
  type ProfileLayoutProfile,
} from '@dreamlake/uikit'

// Minimal two-state theme toggle used to demo the `nameAccessory` slot.
function ThemeToggleDemo({ value, onChange }: { value: 'light' | 'dark'; onChange: (v: 'light' | 'dark') => void }) {
  const isDark = value === 'dark'
  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative inline-flex items-center rounded-full p-[2px] border border-uikit-faint bg-uikit-panel"
    >
      <span
        aria-hidden
        className="absolute top-[2px] rounded-full bg-uikit-chip transition-[left] duration-300 ease-out"
        style={{ left: 2 + (isDark ? 22 : 0), width: 22, height: 22 }}
      />
      <button type="button" onClick={() => onChange('light')}
        className="relative z-[1] inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border-0 bg-transparent cursor-pointer text-uikit-muted aria-pressed:text-uikit-ink"
        aria-pressed={!isDark}>
        <Sun size={13} strokeWidth={2} />
      </button>
      <button type="button" onClick={() => onChange('dark')}
        className="relative z-[1] inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border-0 bg-transparent cursor-pointer text-uikit-muted aria-pressed:text-uikit-ink"
        aria-pressed={isDark}>
        <Moon size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

const BASE_PROFILE: Omit<ProfileLayoutProfile, 'image' | 'onAvatarChange' | 'onEditClick' | 'nameAccessory'> = {
  name: 'MIT CSAIL',
  handle: 'mit-csail',
  kind: 'org',
  bio: 'Computer Science and Artificial Intelligence Laboratory at MIT — robot learning, world models, large-scale data infra.',
  facts: [
    { label: 'kind',     value: 'organization'  },
    { label: 'joined',   value: 'Aug 2023'      },
    { label: 'location', value: 'Cambridge, MA' },
    { label: 'url',      value: 'csail.mit.edu' },
    { label: 'teams',    value: '12'            },
  ],
  members: [
    { id: 'u-geyang',  name: 'Ge Yang' },
    { id: 'u-pulkit',  name: 'Pulkit Agrawal' },
    { id: 'u-josh',    name: 'Josh Tenenbaum' },
    { id: 'u-leslie',  name: 'Leslie Kaelbling' },
    { id: 'u-tomas',   name: 'Tomás Lozano-Pérez' },
    { id: 'u-ada',     name: 'Ada Lovelace' },
    { id: 'u-alan',    name: 'Alan Turing' },
    { id: 'u-marvin',  name: 'Marvin Minsky' },
    { id: 'u-john',    name: 'John McCarthy' },
    { id: 'u-grace',   name: 'Grace Hopper' },
    { id: 'u-claude',  name: 'Claude Shannon' },
    { id: 'u-norbert', name: 'Norbert Wiener' },
    { id: 'u-noam',    name: 'Noam Chomsky' },
    { id: 'u-judith',  name: 'Judith Wright' },
  ],
}

const PROJECTS = [
  { name: 'geyang / coffee-demo',           tag: 'private', right: '14m ago', desc: 'Personal sandbox for the ge-coffee-demo recordings.',                      footer: '3b · 1ds · 2pl' },
  { name: 'mit-csail / droid-curation',     tag: 'private', right: '2h ago',  desc: 'Curate teleop episodes from the droid-2024 collection.',                   footer: '14b · 3ds · 4pl · 2 active' },
  { name: 'mit-csail / ego4d-clip-labels',  tag: 'public',  right: '6h ago',  desc: 'Crowd-sourced action labels on ego4d kitchen subset.',                     footer: '4b · 2ds · 2pl · 1 active' },
  { name: 'geyang / bench-2026',            tag: 'public',  right: '3d ago',  desc: 'Public benchmark suite for foundation policies.',                          footer: '8b · 5ds · 3pl · 1 active' },
  { name: 'mit-csail / mujoco-eval-suite',  tag: 'private', right: '1d ago',  desc: 'Eval harness over policy-v3 unrolls in MuJoCo.',                           footer: '6b · 2ds · 3pl' },
  { name: 'geyang / thesis-figures',        tag: 'private', right: '5d ago',  desc: 'Notebooks + plots for thesis ch. 4–5.',                                    footer: '1b · 0ds · 1pl' },
  { name: 'mit-csail / imagenet-mirror',    tag: 'private', right: 'Mar 12',  desc: 'Internal mirror + integrity checks of imagenet-1M / 14M.',                 footer: '2b · 4ds · 1pl' },
]

const PIPELINES = [
  { name: 'coffee-pack',  tag: 'python',   right: 'v3 · 14m ago', desc: 'Pack ge-coffee-demo into a frozen dataset.',      footer: '11 nodes · 2 comments' },
  { name: 'thesis-plots', tag: 'markdown', right: 'v1 · 5d ago',  desc: 'Plot generation for thesis ch. 4–5.',             footer: '7 nodes · 0 comments' },
  { name: 'bench-runner', tag: 'git',      right: 'v6 · 3d ago',  desc: 'Bench-2026 runner pinned to git ref.',            footer: '19 nodes · 5 comments' },
]

const DATASETS = [
  { name: 'droid-2024-teleop',  tag: 'private', right: '2h ago',  desc: 'Raw teleop recordings from DROID robot arm.',    footer: '1.4 TB · 12k eps' },
  { name: 'ego4d-kitchen-clip', tag: 'public',  right: '6h ago',  desc: 'Clipped kitchen subset of Ego4D with labels.',   footer: '220 GB · 4.1k clips' },
]

function ProjectsTab({ cols }: { cols: 1 | 2 }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')

  const publicCount = PROJECTS.filter(p => p.tag === 'public').length
  const privateCount = PROJECTS.filter(p => p.tag === 'private').length

  const filters = [
    { value: 'all',     label: 'all',     count: PROJECTS.length },
    { value: 'public',  label: 'public',  count: publicCount },
    { value: 'private', label: 'private', count: privateCount },
  ]

  const visible = PROJECTS
    .filter(p => filter === 'all' || p.tag === filter)
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-end pt-5 pb-2">
        <span className="font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug text-uikit-ink opacity-80 hover:opacity-100 bg-transparent hover:bg-uikit-ink-5 px-2 py-1 rounded-md cursor-pointer transition-[background,opacity] duration-[120ms] inline-flex items-center">
          + new project
        </span>
      </div>
      <FilterBar
        filters={filters}
        filterValue={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        placeholder="search projects…"
        sortValue={sort}
        onSortChange={setSort}
        sortOptions={[
          { value: 'recent',  label: 'recent' },
          { value: 'oldest',  label: 'oldest' },
          { value: 'name-az', label: 'name a–z' },
        ]}
      />
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: cols === 2 ? '1fr 1fr' : '1fr' }}
      >
        {visible.map(p => (
          <ProfileCard
            key={p.name}
            title={p.name}
            tag={p.tag}
            titleRight={p.right}
            description={p.desc}
            footer={p.footer}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  )
}

function PipelinesTab() {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {PIPELINES.map(p => (
        <ProfileCard
          key={p.name}
          title={p.name}
          tag={p.tag}
          titleRight={p.right}
          description={p.desc}
          footer={p.footer}
          onClick={() => {}}
        />
      ))}
    </div>
  )
}

function OverviewSection({
  label, right, stickyTop, children,
}: { label: string; right?: string; stickyTop: number; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="sticky z-[5] flex items-baseline gap-2 pt-3.5 pb-2.5 bg-uikit-bg border-b border-uikit-faint"
        style={{ top: stickyTop }}
      >
        <span className="font-uikit-mono text-uikit-10 font-medium text-uikit-muted opacity-80 tracking-uikit-widest uppercase">
          {label}
        </span>
        <span className="flex-1" />
        {right && (
          <span className="font-uikit-mono text-uikit-10 text-uikit-muted opacity-55 tracking-uikit-snug">
            {right}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 pt-2">
        {children}
      </div>
    </div>
  )
}

function OverviewTab({ stickyTop }: { stickyTop: number }) {
  return (
    <div className="pt-6 flex flex-col gap-9">
      <OverviewSection label="Pinned projects" right={`${PROJECTS.length} total`} stickyTop={stickyTop}>
        {PROJECTS.slice(0, 4).map(p => (
          <ProfileCard key={p.name} title={p.name} tag={p.tag} titleRight={p.right} description={p.desc} footer={p.footer} onClick={() => {}} />
        ))}
      </OverviewSection>
      <OverviewSection label="Recent datasets" right={`${DATASETS.length} total`} stickyTop={stickyTop}>
        {DATASETS.map(d => (
          <ProfileCard key={d.name} title={d.name} tag={d.tag} titleRight={d.right} description={d.desc} footer={d.footer} onClick={() => {}} />
        ))}
      </OverviewSection>
      <OverviewSection label="Recent pipelines" right={`${PIPELINES.length} total`} stickyTop={stickyTop}>
        {PIPELINES.map(p => (
          <ProfileCard key={p.name} title={p.name} tag={p.tag} titleRight={p.right} description={p.desc} footer={p.footer} onClick={() => {}} />
        ))}
      </OverviewSection>
    </div>
  )
}

function EmptyTabContent({ message }: { message: string }) {
  return (
    <div className="py-5 font-uikit-mono text-uikit-11 leading-uikit-snug text-uikit-muted opacity-55 tracking-uikit-snug">
      {message}
    </div>
  )
}

export const ProfileLayoutSpec = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  // Local state so the demo's editable affordances actually do something:
  // - avatar image is mutated by the built-in upload sheet
  // - pencil button opens a stub "edit" alert (caller-owned in real apps)
  // - theme toggle drives a local pill (demo scope only)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const profile: ProfileLayoutProfile = {
    ...BASE_PROFILE,
    image: avatarUrl,
    onAvatarChange: (file) => {
      if (file === null) { setAvatarUrl(undefined); return }
      // Convert to data URL so the demo can preview it without a backend.
      return new Promise<void>((resolve) => {
        const r = new FileReader()
        r.onload = () => { setAvatarUrl(String(r.result)); resolve() }
        r.readAsDataURL(file)
      })
    },
    onEditClick: () => alert('Open profile edit dialog (caller-owned)'),
    nameAccessory: <ThemeToggleDemo value={theme} onChange={setTheme} />,
  }

  const tabs: ProfileLayoutTab[] = [
    {
      value: 'overview',
      label: 'Overview',
      render: (_cols, scrolled) => (
        <OverviewTab stickyTop={scrolled ? TOPBAR_H_SMALL : TOPBAR_H_SMALL + 22} />
      ),
    },
    {
      value: 'projects',
      label: 'Projects',
      showColsToggle: true,
      render: (cols) => <ProjectsTab cols={cols} />,
    },
    {
      value: 'datasets',
      label: 'Datasets',
      render: () => <EmptyTabContent message="No datasets published." />,
    },
    {
      value: 'pipelines',
      label: 'Pipelines',
      render: () => <PipelinesTab />,
    },
    {
      value: 'jobs',
      label: 'Jobs',
      render: () => <EmptyTabContent message="No jobs running." />,
    },
  ]
  return (
    <div
      ref={containerRef}
      className="uikit-no-scrollbar relative h-[720px] overflow-y-auto overflow-x-hidden border border-uikit-faint rounded-xl"
    >
      <ProfileLayout
        profile={profile}
        tabs={tabs}
        defaultTab="projects"
        scrollContainerRef={containerRef as React.RefObject<HTMLElement>}
        logo={
          <span className="text-uikit-17 font-semibold tracking-uikit-tighter text-uikit-ink">
            dream<span className="text-uikit-accent font-black">.</span>lake
          </span>
        }
        actions={
          <span className="font-uikit-mono text-uikit-11 font-medium text-uikit-muted opacity-85 cursor-pointer tracking-uikit-snug">
            Account ▾
          </span>
        }
      />
    </div>
  )
}
