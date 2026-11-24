// Mounts the taxon band (taxon-hero/) inside the taxon-page header, above the
// tabs. Done here, after start-up, because TaxonPages' own region hooks are
// read before custom panels have loaded.
import { createApp } from 'vue'

export default function setup(app, { router, store }) {
  if (typeof window === 'undefined') return

  let mounted = null
  let loading = null

  async function place() {
    const onTaxon = /^#\/otus\/\d+/.test(window.location.hash)
    const header = onTaxon ? document.querySelector('#main-content .pt-6.pb-6, main .pt-6.pb-6') : null
    if (!header) {
      if (mounted && !mounted.el.isConnected) {
        mounted.app.unmount()
        mounted = null
      }
      return
    }
    if (mounted && mounted.el.isConnected && mounted.el.parentNode === header) return
    if (loading) return
    loading = (async () => {
      const [{ default: HeroHost }, { useOtuStore }] = await Promise.all([
        import('../../taxon-hero/HeroHost.vue'),
        import('@/modules/otus/store/store')
      ])
      if (mounted) {
        mounted.app.unmount()
        mounted.el.remove()
      }
      const el = document.createElement('div')
      el.className = 'cow-hero-host'
      header.appendChild(el)
      const heroApp = createApp(HeroHost, { useStore: useOtuStore })
      heroApp.use(router)
      heroApp.use(store)
      heroApp.mount(el)
      mounted = { app: heroApp, el }
    })().finally(() => (loading = null))
  }

  router.afterEach(() => setTimeout(place, 0))
  const observer = new MutationObserver(() => place())
  const start = () => {
    place()
    const root = document.getElementById('app') || document.body
    observer.observe(root, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else setTimeout(start, 0)
}
