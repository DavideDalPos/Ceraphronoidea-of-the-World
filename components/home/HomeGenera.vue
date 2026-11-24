<template>
  <section class="cow-home__sec cow-gx">
    <div class="cow-home__row">
      <div>
        <p class="cow-home__kicker">Browse</p>
        <h2 class="cow-home__h2">Genera</h2>
      </div>
      <div class="cow-gx__tools">
        <input
          v-model="q"
          type="search"
          placeholder="Find a genus…"
          aria-label="Find a genus"
        />
        <div
          class="cow-gx__sort"
          role="group"
          aria-label="Sort genera"
        >
          <button
            type="button"
            :class="{ 'is-on': sort === 'n' }"
            @click="sort = 'n'"
          >
            Most species
          </button>
          <button
            type="button"
            :class="{ 'is-on': sort === 'az' }"
            @click="sort = 'az'"
          >
            A–Z
          </button>
        </div>
      </div>
    </div>

    <p
      v-if="loading"
      class="cow-home__muted"
    >
      Loading genera…
    </p>
    <div
      v-else
      class="cow-gx__cols"
    >
      <article
        v-for="f in columns"
        :key="f.name"
        :class="['cow-gx__fam', { 'is-fossil': f.fossil }]"
      >
        <header>
          <RouterLink
            :to="{ name: 'otus-id-overview', params: { id: String(f.otu) } }"
            class="cow-gx__famname"
            ><template v-if="f.fossil">† </template>{{ f.name }}</RouterLink
          >
          <p>
            <b>{{ f.genera.length }}</b> genera listed
          </p>
        </header>
        <ul>
          <li
            v-for="g in f.shown"
            :key="g.id"
            :class="{ 'is-empty': !g.n }"
          >
            <RouterLink
              :to="{ name: 'otus-id-overview', params: { id: String(g.id) } }"
              :title="`${g.name} ${g.author} · ${g.n || 'no'} species`"
            >
              <span class="cow-gx__name"><template v-if="g.fossil">† </template><i>{{ g.name }}</i></span>
              <span class="cow-gx__bar"><span :style="{ width: g.n ? `${Math.max(3, (g.n / maxN) * 100)}%` : 0 }" /></span>
              <span class="cow-gx__n">{{ g.n || '—' }}</span>
            </RouterLink>
          </li>
        </ul>
        <p
          v-if="!f.shown.length"
          class="cow-home__muted"
        >
          No genus matches.
        </p>
      </article>
    </div>
    <p class="cow-gx__note">
      Numbers are valid species entered in the catalogue. “—” means no species are entered under that genus yet (or
      they sit in a subgenus). † fossil.
    </p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { makeAPIRequest } from '@/utils/request'

const FAMILIES = [
  { name: 'Ceraphronidae', otu: 1372559, tn: 1541973 },
  { name: 'Megaspilidae', otu: 1372988, tn: 1550504 },
  { name: 'Stigmaphronidae', otu: 1373001, tn: 1542779, fossil: true }
]
const SUPERFAMILY = 1541972

const loading = ref(true)
const fams = ref([])
const q = ref('')
const sort = ref('n')

const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
// species = leaves whose name has an epithet; subgenera are walked through
function countSpecies(node) {
  let n = 0
  for (const d of node.descendants || []) {
    if ((d.descendants || []).length) n += countSpecies(d)
    else if (/^[A-Z][a-z]+(\s+\([A-Z][a-z]+\))?\s+[a-z]/.test(strip(d.name))) n++
  }
  return n
}

onMounted(async () => {
  try {
    // fossil genus names, for the † mark
    const fossilGenera = new Set()
    await makeAPIRequest
      .get('/taxon_names', {
        params: { 'taxon_name_id[]': SUPERFAMILY, descendants: true, nomenclature_group: 'Genus', 'taxon_name_classification[]': 'TaxonNameClassification::Iczn::Fossil', per: 500 }
      })
      .then((r) => (r.data || []).forEach((t) => fossilGenera.add(t.cached)))
      .catch(() => {})

    fams.value = await Promise.all(
      FAMILIES.map(async (f) => {
        const { data } = await makeAPIRequest.get(`/otus/${f.otu}/inventory/taxonomy.json`)
        // genera may sit directly under the family or under subfamilies/tribes
        const genera = []
        const walk = (node) => {
          for (const d of node.descendants || []) {
            const name = strip(d.name)
            const m = name.match(/^([A-Z][a-z]+)\s*(.*)$/)
            if (/idae\b|inae\b|ini\b/.test(m?.[1] || '')) walk(d)
            else if (m) genera.push({ id: d.otu_id, name: m[1], author: m[2], n: countSpecies(d), fossil: fossilGenera.has(m[1]) })
          }
        }
        walk(data)
        return { ...f, genera, species: genera.reduce((s, g) => s + g.n, 0) }
      })
    )
  } catch {
    fams.value = []
  } finally {
    loading.value = false
  }
})

const maxN = computed(() => Math.max(1, ...fams.value.flatMap((f) => f.genera.map((g) => g.n))))
const columns = computed(() => {
  const term = q.value.trim().toLowerCase()
  return fams.value.map((f) => ({
    ...f,
    shown: f.genera
      .filter((g) => !term || g.name.toLowerCase().includes(term))
      .sort((a, b) => (sort.value === 'n' ? b.n - a.n || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)))
  }))
})
</script>
