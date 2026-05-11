import ReactDOM from 'react-dom/client'
import { Layout } from './Layout'
import { PageContextProvider } from 'vike-react/usePageContext'

let root: ReactDOM.Root | null = null

export async function onRenderClient(pageContext: any) {
  const { Page, pageProps } = pageContext
  const container = document.getElementById('root')!
  const tree = (
    <PageContextProvider pageContext={pageContext}>
      <Layout>
        <Page {...pageProps} />
      </Layout>
    </PageContextProvider>
  )
  if (!root) {
    if (container.innerHTML !== '') {
      root = ReactDOM.hydrateRoot(container, tree)
    } else {
      root = ReactDOM.createRoot(container)
      root.render(tree)
    }
  } else {
    root.render(tree)
  }
}
