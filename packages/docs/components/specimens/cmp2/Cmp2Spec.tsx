import { Button, FilterBar } from '@dreamlake/uikit'

const MONO = { fontFamily: 'var(--f-mono)' } as const

const Box = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
  <div data-shot={id} style={{ padding: '18px 20px', background: 'var(--bg)', width: 460 }}>
    <div
      style={{
        ...MONO,
        fontSize: 9,
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: 'var(--uikit-muted)',
        marginBottom: 12,
      }}
    >
      {label}
    </div>
    {children}
  </div>
)

/** A: the kit's dialog footer today. */
const KitFooter = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
    <Button variant="ghost" size="sm">Cancel</Button>
    <Button variant="primary" size="sm">Create team</Button>
  </div>
)

/** B: dialogForm's DlgCancel + DlgPrimary, verbatim from origin/main. */
const DesignFooter = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
    <span style={{ ...MONO, fontSize: 11.5, color: 'var(--muted)', opacity: 0.8, letterSpacing: '-.005em', cursor: 'pointer' }}>
      cancel
    </span>
    <span
      style={{
        ...MONO,
        fontSize: 11,
        fontWeight: 500,
        color: '#fff',
        letterSpacing: '-.005em',
        background: 'var(--uikit-accent)',
        padding: '5px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      create team
    </span>
  </div>
)

export const Cmp2Spec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <Box id="footer-kit" label="A · kit today — ghost + inverted-ink primary">
      <KitFooter />
    </Box>
    <Box id="footer-design" label="B · dreamlake dialogForm — bare cancel + accent primary">
      <DesignFooter />
    </Box>
    <Box id="fb-mono" label="A · FilterBar search line today — mono">
      <FilterBar query="lake" onQueryChange={() => {}} />
    </Box>
    <Box id="fb-ui" label="B · same line, UI face">
      <div id="fb-ui-scope">
        <style>{`#fb-ui-scope input { font-family: var(--f-ui) !important; }`}</style>
        <FilterBar query="lake" onQueryChange={() => {}} />
      </div>
    </Box>
  </div>
)
