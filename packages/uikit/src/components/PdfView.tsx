import { useEffect, useState, type ReactNode } from 'react'

export interface PdfViewProps {
  /** Authorized PDF URL. Hosts own fetching, MIME normalization and cleanup. */
  src: string
  title: string
  fallback?: ReactNode
}

/** A document fills its tab; the browser owns scrolling and PDF navigation. */
export function PdfView({ src, title, fallback }: PdfViewProps) {
  const [supported, setSupported] = useState(true)
  useEffect(() => {
    setSupported(navigator.pdfViewerEnabled !== false)
  }, [])
  const alternative = fallback ?? (
    <p role="status">
      PDF preview is unavailable in this browser.{' '}
      <a href={src} target="_blank" rel="noopener noreferrer">
        Open PDF
      </a>
    </p>
  )
  if (!supported) return alternative
  const url = `${src.split('#')[0]}#toolbar=0&navpanes=0&pagemode=none&view=FitH`
  return (
    <object
      data={url}
      type="application/pdf"
      aria-label={title}
      title={title}
      style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
    >
      {alternative}
    </object>
  )
}
