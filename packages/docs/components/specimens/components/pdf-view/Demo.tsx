import { PdfView } from '@dreamlake/uikit'

export function Demo() {
  return (
    <div style={{ height: 480 }} aria-label="PDF example">
      <PdfView src="/examples/preview.pdf" title="Two-page sample document" />
    </div>
  )
}
