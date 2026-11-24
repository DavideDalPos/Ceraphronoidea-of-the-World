<template>
  <HomeHero />
  <div class="cow-home">
    <!-- The three families -->
    <section class="cow-home__sec">
      <p class="cow-home__kicker">The superfamily</p>
      <h2 class="cow-home__h2">Three families</h2>
      <div class="cow-fam">
        <RouterLink
          v-for="f in FAMILIES"
          :key="f.name"
          :to="{ name: 'otus-id-overview', params: { id: String(f.otu) } }"
          :class="['cow-fam__card', { 'cow-fam__card--fossil': !f.img }]"
        >
          <img
            v-if="f.img"
            :src="asset(f.img)"
            :alt="f.alt"
            loading="lazy"
          />
          <span class="cow-fam__shade" />
          <span class="cow-fam__body">
            <span class="cow-fam__tag">{{ f.tag }}</span>
            <span class="cow-fam__name">{{ f.name }}</span>
            <span class="cow-fam__nums">
              <span><b>{{ counts[f.name]?.species ?? '…' }}</b> species</span>
              <span><b>{{ counts[f.name]?.genera ?? '…' }}</b> genera</span>
            </span>
            <span class="cow-fam__go">Open family →</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <HomeToday />

    <!-- What you can do here -->
    <section class="cow-home__sec">
      <p class="cow-home__kicker">Use the site</p>
      <h2 class="cow-home__h2">Start here</h2>
      <div class="cow-tools">
        <RouterLink
          v-for="t in TOOLS"
          :key="t.title"
          :to="t.to"
          class="cow-tools__card"
        >
          <span
            class="cow-tools__icon"
            v-html="t.icon"
          />
          <span class="cow-tools__title">{{ t.title }}</span>
          <span class="cow-tools__text">{{ t.text }}</span>
          <span class="cow-tools__go">{{ t.go }} →</span>
        </RouterLink>
      </div>
    </section>

    <HomeGenera />

    <!-- About band -->
    <section class="cow-about-band">
      <div class="cow-about-band__text">
        <p class="cow-home__kicker">About</p>
        <h2 class="cow-home__h2">A world catalogue of ceraphronoid wasps</h2>
        <p>
          Ceraphronoidea are small parasitoid wasps, most only a few millimetres long. Their recorded hosts range from
          gall midges, scale insects and lacewings to other parasitoid wasps, which makes many of them hyperparasitoids
          of aphids.
        </p>
        <p>
          Every name, image, host record and specimen here is curated in TaxonWorks and cited to its source, following
          Johnson &amp; Musetti (2004).
        </p>
        <RouterLink
          to="/about"
          class="cow-btn"
          >About the project and team</RouterLink
        >
      </div>
      <div class="cow-about-band__people">
        <figure>
          <img
            :src="asset('/images/istvan-miko-photo.webp')"
            alt="István Mikó"
            loading="lazy"
          />
          <figcaption><b>István Mikó</b>University of New Hampshire</figcaption>
        </figure>
        <figure>
          <img
            :src="asset('/images/shane-tilton-photo.jpg')"
            alt="Shane Tilton"
            loading="lazy"
          />
          <figcaption><b>Shane Tilton</b>Data manager and developer</figcaption>
        </figure>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { makeAPIRequest } from '@/utils'
import { resolveAssetUrl } from '@/utils/url'
import HomeHero from './home/HomeHero.vue'
import HomeToday from './home/HomeToday.vue'
import HomeGenera from './home/HomeGenera.vue'

const { base_url } = __APP_ENV__
const asset = (p) => resolveAssetUrl(p, base_url)

// valid names in TaxonWorks (taxon name id) and their taxon pages (OTU id)
const SUPERFAMILY = 1541972
const FAMILIES = [
  { name: 'Ceraphronidae', tn: 1541973, otu: 1372559, tag: 'Living', img: '/images/ceraphron-aguinaldoi-hero.jpg', alt: 'Ceraphron aguinaldoi' },
  { name: 'Megaspilidae', tn: 1550504, otu: 1372988, tag: 'Living', img: '/images/conostigmus-tubifer-point.jpg', alt: 'Conostigmus tubifer' },
  { name: 'Stigmaphronidae', tn: 1542779, otu: 1373001, tag: 'Extinct · Cretaceous', img: '', alt: '' }
]

const ICON = {
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h7v7H4zM13 13h7v7h-7zM11 7.5h4.5V13M13 16.5H8.5V11"/></svg>',
  host: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l2.8 8.3M16 7.5l-2.8 8.3M8.5 6h7"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h7"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
}
const TOOLS = [
  { title: 'Identify a specimen', text: 'Illustrated keys to genera and species: one couplet at a time.', go: 'Open the keys', to: '/keys', icon: ICON.key },
  { title: 'Hosts & interactions', text: 'Who attacks whom: every host record, by genus and host order.', go: 'Explore hosts', to: '/interactions', icon: ICON.host },
  { title: 'Literature', text: 'Two centuries of papers, by year, author and journal.', go: 'Literature', to: '/literature', icon: ICON.book },
  { title: 'Atlas', text: 'Species in each biogeographic realm, and which live nowhere else.', go: 'Open the atlas', to: '/atlas', icon: ICON.pin },
  { title: 'Type specimens', text: 'Every holotype, lectotype and paratype, by museum.', go: 'Type catalogue', to: '/types', icon: ICON.key },
  { title: 'Specimens & records', text: 'Museum specimens and literature records, filtered and downloadable.', go: 'Browse records', to: '/specimens', icon: ICON.pin }
]

const counts = reactive({})

const total = (r) => Number(r.headers['pagination-total']) || 0
const countNames = (tn, group) =>
  makeAPIRequest
    .get('/taxon_names', { params: { 'taxon_name_id[]': tn, descendants: true, nomenclature_group: group, validity: true, per: 1 } })
    .then(total)

onMounted(async () => {
  FAMILIES.forEach(async (f) => {
    try {
      const [species, gens] = await Promise.all([
        countNames(f.tn, 'Species'),
        // genus rank only (the Genus group also holds subgenera)
        makeAPIRequest
          .get('/taxon_names', { params: { 'taxon_name_id[]': f.tn, descendants: true, nomenclature_group: 'Genus', validity: true, per: 500 } })
          .then((r) => (r.data || []).filter((t) => /::genus$/i.test(t.rank_string || '')).length)
      ])
      counts[f.name] = { species, genera: gens }
    } catch {
      counts[f.name] = { species: '—', genera: '—' }
    }
  })

})

</script>
