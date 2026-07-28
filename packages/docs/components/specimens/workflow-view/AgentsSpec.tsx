import { AgentInstanceCard } from '@dreamlake/uikit'
import { AGENTS } from './specs'

// Agent instances are the run-time cards that fan out (stack) under their uda
// node — a compact card per sub-agent, tinted by its own state, with token /
// duration bits when the runner supplies them.
export const AgentsSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
    {AGENTS.map((agent) => <AgentInstanceCard key={agent.agentId} agent={agent} />)}
  </div>
)
