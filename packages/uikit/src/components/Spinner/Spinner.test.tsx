import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Spinner } from './Spinner'
import { Button } from '../Button'

describe('one loading animation', () => {
  it('renders an accessible Braille glyph and lets busy buttons own their label', () => {
    const markup = renderToStaticMarkup(<Spinner aria-label="Connecting" />)
    expect(markup).toContain('aria-label="Connecting"')
    expect(markup).toContain('⠋\n⠙\n⠹\n⠸\n⠼\n⠴\n⠦\n⠧\n⠇\n⠏')
    expect(markup).not.toContain('<svg')
    const button = renderToStaticMarkup(<Button loading>Save</Button>)
    expect(button).toContain('data-spinner="braille"')
    expect(button).toContain('aria-hidden="true"')
    expect(button).toContain('disabled=""')
  })

  it('rejects alternate rotating/pulsing loaders in UIKit components', () => {
    const root = join(__dirname, '..')
    function sources(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
        ? sources(join(dir, e.name))
        : /\.(tsx?|css)$/.test(e.name) && !e.name.includes('.test.') ? [join(dir, e.name)] : [])
    }
    const offenders = sources(root).filter(p => /animate-spin|animate-pulse|<animate(?:Transform|\s|>)|va-bufring|\bLoader(?:2|Circle|Pinwheel)?\b/.test(readFileSync(p, 'utf8')))
    expect(offenders).toEqual([])
  })
})
