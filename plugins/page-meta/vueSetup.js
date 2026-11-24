// Sets <meta name="description"> (and the Open Graph title/description used by
// link previews) for each page, so search results show something useful.
const SITE = 'Ceraphronoidea of the World'
const DEFAULT =
  'Names, images, host records, identification keys, type specimens and literature for the ceraphronoid wasps (Hymenoptera: Ceraphronoidea), curated in TaxonWorks.'
const PAGES = {
  '/atlas': 'Where ceraphronoid wasps live: species recorded in each biogeographic realm.',
  '/interactions': 'Hosts, prey and food webs of ceraphronoid wasps, from the literature.',
  '/types': 'Type specimens of Ceraphronoidea: holotypes, lectotypes and paratypes by repository.',
  '/fossils': 'The extinct family Stigmaphronidae and all fossil Ceraphronoidea.',
  '/literature': 'The literature on Ceraphronoidea, searchable by author, year and journal.',
  '/keys': 'Identification keys to Ceraphronoidea.',
  '/cite': 'How to cite Ceraphronoidea of the World, its taxon pages, data and images.',
  '/specimens': 'Museum specimens and literature records of Ceraphronoidea, downloadable as Darwin Core.',
  '/about': 'About the Ceraphronoidea of the World project and team.'
}

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

export default function setup(app, { router }) {
  if (typeof window === 'undefined') return
  router.afterEach((to) => {
    setTimeout(() => {
      const onTaxon = /^\/otus\//.test(to.path)
      const name = onTaxon ? (document.title.split(' - ').slice(1).join(' - ') || '').trim() : ''
      const desc = onTaxon && name ? `${name}: nomenclature, images, hosts, distribution and references in ${SITE}.` : PAGES[to.path] || DEFAULT
      setMeta('name', 'description', desc)
      setMeta('property', 'og:title', document.title || SITE)
      setMeta('property', 'og:description', desc)
    }, 600)
  })
}
