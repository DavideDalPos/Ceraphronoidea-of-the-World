<template>
  <div class="cow-ab">
    <!-- 1. meet the wasps -->
    <section class="cow-ab__intro">
      <div class="cow-ab__text">
        <p class="cow-ab__kicker">
          The wasps
        </p>
        <h2 class="cow-ab__h2">
          Small, everywhere, and barely known
        </h2>
        <p>
          Ceraphronoidea are tiny parasitoid wasps, most of them one to four millimetres long. The superfamily has three
          families: <b>Ceraphronidae</b> and <b>Megaspilidae</b>, living worldwide, and the extinct
          <b>Stigmaphronidae</b>, known only from Cretaceous amber and rock.
        </p>
        <p>
          Their larvae develop on other insects: gall midges, aphids, scale insects, lacewings, flies, and often other
          parasitoid wasps, which makes many of them hyperparasitoids. They are common in almost every land habitat,
          yet few people notice them, and many species are still undescribed.
        </p>
        <p>
          This site brings together what is known about them: names and their history, images, hosts, specimens,
          distributions, keys and the literature.
        </p>
      </div>
      <div class="cow-ab__photos">
        <figure
          v-for="(p, i) in PHOTOS"
          :key="p.src"
          :class="`p${i}`"
        >
          <img
            :src="asset(p.src)"
            :alt="p.taxon"
            :style="{ objectPosition: p.pos }"
          />
          <figcaption><i>{{ p.taxon }}</i></figcaption>
        </figure>
      </div>
    </section>

    <!-- 2. how the database works -->
    <section class="cow-ab__block">
      <p class="cow-ab__kicker">
        How it works
      </p>
      <h2 class="cow-ab__h2">
        A curated database, not a static website
      </h2>
      <ol class="cow-ab__flow">
        <li>
          <b>Literature &amp; specimens</b>
          <span>Original descriptions, catalogues, host records, type specimens and photographs.</span>
        </li>
        <li>
          <b>TaxonWorks</b>
          <span>Everything is entered and curated in a TaxonWorks project, with a source for every fact.</span>
        </li>
        <li>
          <b>Open API</b>
          <span>The TaxonWorks API serves the data as JSON and Darwin Core, to anyone.</span>
        </li>
        <li>
          <b>This website</b>
          <span>Pages are built live from the API, so a correction in the database shows here at once.</span>
        </li>
      </ol>
      <div class="cow-ab__inside">
        <RouterLink
          v-for="x in inside"
          :key="x.label"
          :to="x.to"
          class="cow-ab__chip"
        >
          <span>{{ x.label }}</span>
          <b v-if="x.value !== null">{{ x.value.toLocaleString() }}</b>
        </RouterLink>
      </div>
    </section>

    <!-- 3. timeline -->
    <section class="cow-ab__block">
      <p class="cow-ab__kicker">
        Milestones
      </p>
      <h2 class="cow-ab__h2">
        From a catalogue to a living database
      </h2>
      <ol class="cow-ab__time">
        <li
          v-for="m in MILESTONES"
          :key="m.year + m.title"
          :class="{ 'is-next': m.next }"
        >
          <span class="cow-ab__year">{{ m.year }}</span>
          <b>{{ m.title }}</b>
          <span>{{ m.text }}</span>
        </li>
      </ol>
    </section>

    <!-- 4 + 5. people and contact -->
    <section class="cow-ab__block">
      <p class="cow-ab__kicker">
        People
      </p>
      <h2 class="cow-ab__h2">
        Who makes this
      </h2>
      <div class="cow-ab__people">
        <article
          v-for="p in PEOPLE"
          :key="p.name"
          class="cow-ab__person"
        >
          <img
            :src="asset(p.photo)"
            :alt="p.name"
          />
          <div>
            <b>{{ p.name }}</b>
            <span class="cow-ab__role">{{ p.role }}</span>
            <span>{{ p.place }}</span>
            <small v-if="p.note">{{ p.note }}</small>
            <span class="cow-ab__links">
              <a
                v-if="p.email"
                :href="`mailto:${p.email}`"
              >{{ p.email }}</a>
              <a
                v-if="p.orcid"
                :href="`https://orcid.org/${p.orcid}`"
                target="_blank"
                rel="noopener"
              >ORCID</a>
            </span>
          </div>
        </article>
        <aside class="cow-ab__contact">
          <p class="cow-ab__kicker">
            Contact
          </p>
          <a
            :href="`mailto:${CONTACT.email}`"
            class="cow-ab__mail"
          >{{ CONTACT.email }}</a>
          <span>{{ CONTACT.office }}</span>
          <span>{{ CONTACT.phone }}</span>
        </aside>
      </div>
    </section>

    <!-- join -->
    <section class="cow-ab__block cow-ab__join">
      <div>
        <p class="cow-ab__kicker">
          Join the project
        </p>
        <h2 class="cow-ab__h2">
          Help fill the gaps
        </h2>
        <p class="cow-ab__lead">
          The project is open to anyone working on Ceraphronoidea. Most useful right now:
        </p>
      </div>
      <div class="cow-ab__needs">
        <div
          v-for="n in NEEDS"
          :key="n.title"
          class="cow-ab__need"
        >
          <b>{{ n.title }}</b>
          <span>{{ n.text }}</span>
          <span class="cow-ab__needlinks">
            <a :href="`mailto:${CONTACT.email}?subject=${encodeURIComponent(`Ceraphronoidea of the World: ${n.title}`)}`">Email</a>
            <a
              :href="`${REPO}/issues/new?title=${encodeURIComponent(n.title + ': ')}`"
              target="_blank"
              rel="noopener"
            >GitHub issue</a>
          </span>
        </div>
      </div>
    </section>

    <!-- 6. one-liners -->
    <section class="cow-ab__small">
      <p>
        <b>Citing</b> · Build the citation for the site, a taxon, data or an image on the
        <RouterLink to="/cite">How to cite</RouterLink> page.
      </p>
      <p>
        <b>Nomenclature</b> · Names follow Johnson &amp; Musetti (2004), with later changes from the literature.
      </p>
      <p>
        <b>Built with</b> · <a href="https://taxonworks.org">TaxonWorks</a> and
        <a href="https://github.com/SpeciesFileGroup/taxonpages">TaxonPages</a> (Species File Group); source code on
        <a :href="REPO">GitHub</a>. Photographs by István Mikó unless credited otherwise.
      </p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { resolveAssetUrl } from '@/utils/url'
import { loadAssociations, isCeraphronoid } from '../../panels/PanelHosts/associations.js'

const { base_url } = __APP_ENV__
const asset = (p) => resolveAssetUrl(p, base_url)
const REPO = 'https://github.com/Shanetiltongc/Ceraphronoidea-of-the-World'
const SUPERFAMILY = 1541972

// ---- edit here ----
const PHOTOS = [
  { src: '/images/ceraphron-aguinaldoi-hero.jpg', taxon: 'Ceraphron aguinaldoi', pos: '50% 50%' },
  { src: '/images/conostigmus-tubifer-point.jpg', taxon: 'Conostigmus tubifer', pos: '55% 40%' },
  { src: '/images/donadiola-francescae-slide.jpg', taxon: 'Donadiola francescae', pos: '35% 62%' }
]
const PEOPLE = [
  {
    name: 'István Mikó',
    role: 'Taxonomy, data curation and imaging',
    place: 'Collections Manager, UNH Collection of Insects and Other Arthropods, University of New Hampshire',
    note: 'Ph.D. and M.S., University of Szeged',
    email: 'Istvan.Miko@unh.edu',
    orcid: '',
    photo: '/images/istvan-miko-photo.webp'
  },
  {
    name: 'Shane Tilton',
    role: 'Data manager, bioinformatics and TaxonPages development',
    place: 'University of New Hampshire',
    note: '',
    email: '',
    orcid: '',
    photo: '/images/shane-tilton-photo.jpg'
  }
]
const CONTACT = {
  email: 'Istvan.Miko@unh.edu',
  office: 'Spaulding Hall, Room 201m, Durham, NH 03824, USA',
  phone: '+1 (603) 862-2488'
}
const MILESTONES = [
  { year: '1807', title: 'First publications', text: 'The oldest reference in the database.' },
  { year: '2004', title: 'World catalogue', text: 'Johnson & Musetti publish the catalogue of the systematic literature of Ceraphronoidea.' },
  { year: '2010', title: 'Anatomy ontology', text: 'The Hymenoptera Anatomy Ontology gives a shared vocabulary for describing these wasps.' },
  { year: '2026', title: 'This website', text: 'Ceraphronoidea of the World goes online, built live from TaxonWorks.' },
  { year: 'Next', title: 'Data releases', text: 'Versioned releases with a DOI on Zenodo, and more images and host records.', next: true }
]
const NEEDS = [
  { title: 'Images', text: 'Photographs of types and identified specimens, with permission to share.' },
  { title: 'Host records', text: 'Rearing records and host data from papers we have missed.' },
  { title: 'Specimen data', text: 'Ceraphronoid holdings from your collection, as a spreadsheet or Darwin Core.' },
  { title: 'Corrections', text: 'A wrong name, date, host or locality? Tell us and we will fix it at the source.' }
]
// -------------------

const facts = reactive([
  { label: 'valid species', value: null, to: '/' },
  { label: 'valid genera', value: null, to: '/' },
  { label: 'host records', value: null, to: '/interactions' },
  { label: 'images', value: null, to: '/types' }
])
const inside = reactive([
  { label: 'Names', value: null, to: '/' },
  { label: 'Images', value: null, to: '/types' },
  { label: 'Host records', value: null, to: '/interactions' },
  { label: 'Specimen records', value: null, to: '/specimens' },
  { label: 'References', value: null, to: '/literature' },
  { label: 'Keys', value: null, to: '/keys' },
  { label: 'Fossils', value: null, to: '/fossils' },
  { label: 'Distribution', value: null, to: '/atlas' }
])
const total = (r) => Number(r.headers['pagination-total']) || 0

onMounted(() => {
  const names = (group) =>
    makeAPIRequest.get('/taxon_names', { params: { 'taxon_name_id[]': SUPERFAMILY, descendants: true, nomenclature_group: group, validity: true, per: 1 } }).then(total)
  names('Species').then((v) => (facts[0].value = v)).catch(() => {})
  makeAPIRequest
    .get('/taxon_names', { params: { 'taxon_name_id[]': SUPERFAMILY, descendants: true, nomenclature_group: 'Genus', validity: true, per: 500 } })
    .then((r) => (facts[1].value = (r.data || []).filter((t) => /::genus$/i.test(t.rank_string || '')).length))
    .catch(() => {})
  loadAssociations()
    .then((rows) => {
      const n = rows.filter((r) => isCeraphronoid(r.s)).length
      facts[2].value = n
      inside[2].value = n
    })
    .catch(() => {})
  makeAPIRequest
    .get('/stats')
    .then(({ data }) => {
      const d = data?.data || data || {}
      facts[3].value = d.Images || 0
      inside[1].value = d.Images || null
      inside[3].value = d['Collection objects'] || null
      inside[4].value = d['Project sources'] || null
      inside[0].value = d['Taxon names'] || null
    })
    .catch(() => {})
})
</script>
