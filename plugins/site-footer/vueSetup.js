// Mounts the site footer (site-footer/SiteFooter.vue) just above TaxonPages'
// own footer, on every page. It shares the app's router so its links work.
import { createApp } from 'vue'
import SiteFooter from '../../site-footer/SiteFooter.vue'

export default function setup(app, { router }) {
  if (typeof window === 'undefined') return

  let mounted = null
  function place() {
    const footer = document.querySelector('footer.footer')
    if (!footer) return
    if (mounted && mounted.el.isConnected && mounted.el.nextElementSibling === footer) return
    if (mounted) {
      mounted.app.unmount()
      mounted.el.remove()
    }
    const el = document.createElement('div')
    el.className = 'cow-foot-host'
    footer.parentNode.insertBefore(el, footer)
    const footApp = createApp(SiteFooter)
    footApp.use(router)
    footApp.mount(el)
    mounted = { app: footApp, el }
  }

  router.afterEach(() => setTimeout(place, 0))
  const observer = new MutationObserver(() => place())
  const start = () => {
    place()
    observer.observe(document.body, { childList: true, subtree: false })
    const root = document.getElementById('app')
    if (root) observer.observe(root, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else setTimeout(start, 0)
}
