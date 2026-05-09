// Pre-hydration theme bootstrap: read saved preference from localStorage and
// apply data-theme="light|dark" before paint to avoid FOUC.
const themeBootstrap = `(function(){try{
var k='dl-theme', s=localStorage.getItem(k);
if(s!=='light'&&s!=='dark'&&s!=='system') s='system';
var dark = s==='dark' || (s==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme', dark?'dark':'light');
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

export default function HeadDefault() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
    </>
  )
}
