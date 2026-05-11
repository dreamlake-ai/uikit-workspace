import { useLocalStorage } from './use-local-storage'

/**
 * Site-wide "show line numbers" toggle. Every CodeBlock / Preview
 * reads and writes through this hook, so flipping the switch on one
 * block flips them all — both within a single tab (via the
 * `useLocalStorage` custom-event broadcast) and across tabs (via the
 * native `storage` event). Persistence + cross-tab sync are provided
 * by `useLocalStorage`; this file just pins the key + default.
 */
export function useLineNumbers(): [boolean, (v: boolean) => void] {
  return useLocalStorage<boolean>('line-numbers', false)
}
