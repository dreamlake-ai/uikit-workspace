// site.config MUST come first — it runs initDocs before anything renders.
import '../site.config'
import '../styles/app.css'
import '../lib/sidebarGlide'
export { onRenderClient } from '@dreamlake/dockit/client'
