// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { PdfView } from './PdfView'

it('offers an accessible open link when native PDF support is disabled', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(navigator, 'pdfViewerEnabled', { value: false, configurable: true })
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(() => root.render(<PdfView src="blob:pdf" title="Report" />))
    expect(container.querySelector('object')).toBeNull()
    const link = container.querySelector('a')!
    expect(link.textContent).toBe('Open PDF')
    expect(link.href).toBe('blob:pdf')
    expect(link.rel).toBe('noopener noreferrer')
  } finally {
    await act(() => root.unmount())
    Reflect.deleteProperty(navigator, 'pdfViewerEnabled')
    vi.unstubAllGlobals()
  }
})
