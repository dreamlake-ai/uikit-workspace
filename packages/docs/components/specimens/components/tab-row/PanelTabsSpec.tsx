import { useState, type CSSProperties } from 'react'
import { DocumentTabHeading, TabRow } from '@dreamlake/uikit'

/** Shared primitives, without application CSS or a second tab controller. */
export function PanelTabsSpec() {
  const [active, setActive] = useState('memo')
  const [neighbor, setNeighbor] = useState('Terminal')
  const [tabs, setTabs] = useState([
    { value: 'memo', label: 'Release memo', closable: false },
    { value: 'review', label: 'A long project review title', closable: true },
  ])
  const [next, setNext] = useState(1)
  return (
    <div
      data-panel-tabs-example=""
      style={{ '--uikit-document-surface': 'var(--bg)' } as CSSProperties}
    >
      <style>{`
      [data-panel-tabs-example]{background:var(--uikit-workspace-bg);border-radius:12px;padding:12px}
      [data-panel-tabs-grid]{display:grid;grid-template-columns:minmax(160px,.7fr) minmax(0,1.3fr);gap:12px}
      [data-panel-tabs-example] section{min-width:0}
      [data-panel-tabs-example] header{display:flex;align-items:flex-end;gap:8px;height:35px;padding:4px 4px 2px;box-sizing:border-box}
      [data-panel-tabs-example] header .uikit-document-tab{height:29px;box-shadow:0 2px 0 var(--uikit-tab-fill)}
      [data-panel-tabs-example] header .uikit-document-tab::before,[data-panel-tabs-example] header .uikit-document-tab::after{bottom:-3px}
      [data-panel-tabs-example] [data-example-body]{background:var(--bg);border-radius:0 12px 12px 12px;padding:16px;min-height:150px}
      [data-panel-tabs-example] [data-example-body] p{margin:0 0 12px}
      [data-panel-tabs-example] .uikit-tab-row{min-height:35px}
      [data-panel-tabs-example] textarea{box-sizing:border-box;width:100%;min-height:100px;resize:vertical;background:transparent;color:inherit;border:1px solid var(--faint);border-radius:6px;padding:8px}
      [data-panel-tabs-example] [data-workspace-panel]{--uikit-document-surface:var(--uikit-workspace-bg)}
      [data-panel-tabs-example] [data-workspace-panel] [data-example-body]{background:var(--uikit-workspace-bg)}
      [data-panel-tabs-example] button[data-example-action]{margin-left:auto;background:transparent;color:inherit;border:0;border-radius:4px;cursor:pointer;min-width:28px;min-height:28px}
      [data-panel-tabs-example] button[data-example-action]:focus-visible{outline:2px solid var(--uikit-accent)}
      @media(max-width:600px){[data-panel-tabs-grid]{grid-template-columns:minmax(0,1fr)}}
    `}</style>
      <div data-panel-tabs-grid="">
        <section aria-label="Project list">
          <header>
            <DocumentTabHeading>workspace / projects</DocumentTabHeading>
          </header>
          <div data-example-body="">
            <p>
              <strong>Projects</strong>
            </p>
            <p>Release planning</p>
            <p>Design system</p>
          </div>
        </section>
        <section data-workspace-panel="" aria-label="Workspace tools">
          <TabRow
            aria-label="Workspace tools"
            value={neighbor}
            onValueChange={setNeighbor}
            tabs={['Terminal', 'Sessions', 'Chat'].map((label) => ({
              value: label,
              label,
              fitContent: true,
            }))}
          />
          <div data-example-body="" role="tabpanel" aria-label={neighbor}>
            {neighbor === 'Terminal' ? (
              <code>$ ready</code>
            ) : neighbor === 'Sessions' ? (
              'No active sessions.'
            ) : (
              'Start a conversation.'
            )}
          </div>
        </section>
      </div>
      <section aria-label="Retained documents" style={{ marginTop: 12 }}>
        <TabRow
          aria-label="Project documents"
          tabs={tabs.map((tab) => ({ ...tab, panelId: `panel-tabs-example-${tab.value}` }))}
          value={active}
          onValueChange={setActive}
          onClose={(value) => {
            setTabs((current) => current.filter((tab) => tab.value !== value))
            if (active === value) setActive('memo')
          }}
          trailing={
            <button
              data-example-action=""
              aria-label="Add document"
              onClick={() => {
                const value = `draft-${next}`
                setTabs((current) => [
                  ...current,
                  { value, label: `Draft ${next}`, closable: true },
                ])
                setNext(next + 1)
                setActive(value)
              }}
            >
              +
            </button>
          }
        />
        <div data-example-body="">
          {tabs.map((tab) => (
            <div
              key={tab.value}
              id={`panel-tabs-example-${tab.value}`}
              role="tabpanel"
              aria-label={tab.label}
              hidden={active !== tab.value}
            >
              <textarea
                aria-label={`${tab.label} draft`}
                defaultValue={
                  tab.value === 'memo'
                    ? 'Edit this draft, switch tabs, and come back. Your work stays here.'
                    : ''
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
