// The dark "lightbox" band with the taxon name and photos. It is placed above
// the tabs through `taxa_page_regions` in config/taxa_page.yml, and loaded
// lazily so it never takes part in TaxonPages' start-up import order.
import { defineAsyncComponent } from 'vue'

export default {
  id: 'panel:hero',
  component: defineAsyncComponent(() => import('../../taxon-hero/TaxonHero.vue'))
}
