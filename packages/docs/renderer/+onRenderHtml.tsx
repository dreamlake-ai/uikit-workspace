import ReactDOMServer from 'react-dom/server'
import { Layout } from './Layout'
import { PageContextProvider } from 'vike-react/usePageContext'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { pages } from '../lib/navigation'
import { siteConfig } from '../site.config'

export async function onRenderHtml(pageContext: any) {
  const { Page, pageProps, urlPathname } = pageContext
  const html = ReactDOMServer.renderToString(
    <PageContextProvider pageContext={pageContext}>
      <Layout>
        <Page {...pageProps} />
      </Layout>
    </PageContextProvider>,
  )

  // Build per-page <title> and <meta description> from page frontmatter +
  // siteConfig.brand. Unknown paths fall back to brand only.
  const current = pages.find(p => p.path === urlPathname)
  const title = current ? `${current.title} — ${siteConfig.brand}` : siteConfig.brand
  const description = current?.description ?? ''
  // FOUC-safe theme init: runs before paint, sets data-theme on <html>
  // from localStorage or prefers-color-scheme. Reads the same
  // `doc:theme` key the `useLocalStorage`-backed ThemeProvider writes
  // to — values are JSON-encoded ("\"system\"" etc.), so the script
  // tolerates both raw and quoted forms to stay forward-compatible
  // with anyone who manually sets the key.
  const themeScript = dangerouslySkipEscape(
    `<script>(function(){try{var raw=localStorage.getItem('doc:theme');var t=raw;try{t=JSON.parse(raw);}catch(_){}var d=document.documentElement;if(t==='light'){d.setAttribute('data-theme','light');}else if(t==='dark'){d.setAttribute('data-theme','dark');}else{d.setAttribute('data-theme',window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}}catch(e){}})()</script>`,
  )

  return {
    documentHtml: escapeInject`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${themeScript}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <title>${title}</title>
    ${description ? escapeInject`<meta name="description" content="${description}" />` : ''}
    ${current?.noindex ? escapeInject`<meta name="robots" content="noindex, nofollow" />` : ''}
  </head>
  <body>
    <div id="root">${dangerouslySkipEscape(html)}</div>
  </body>
</html>`,
    pageContext: {},
  }
}
