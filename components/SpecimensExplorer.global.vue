<template>
  <div class="cow-sp">
    <p
      v-if="loading"
      class="cow-sp__muted"
    >
      Loading records…
    </p>
    <template v-else>
      <!-- numbers -->
      <dl class="cow-ix__stats">
        <div>
          <dt>Museum specimens</dt>
          <dd>{{ specimens.length }}</dd>
        </div>
        <div>
          <dt>Type specimens</dt>
          <dd>{{ specimens.filter((r) => r.typeStatus).length }}</dd>
        </div>
        <div>
          <dt>Repositories</dt>
          <dd>{{ repoCounts.length }}</dd>
        </div>
        <div>
          <dt>Species with specimens</dt>
          <dd>{{ new Set(specimens.map((r) => r.scientificName)).size }}</dd>
        </div>
        <div>
          <dt>Literature records</dt>
          <dd>{{ citations.length }}</dd>
        </div>
        <div>
          <dt>With photos</dt>
          <dd>{{ specimens.filter((r) => r.associatedMedia).length }}</dd>
        </div>
      </dl>

      <!-- small overview charts -->
      <div class="cow-sp__charts">
        <section class="cow-sp__chart">
          <p class="cow-home__kicker">Specimens by repository</p>
          <button
            v-for="r in repoCounts.slice(0, 8)"
            :key="r.name"
            type="button"
            :class="['cow-sp__hbar', { 'is-on': repo === r.name }]"
            @click="repo = repo === r.name ? '' : r.name"
          >
            <span class="cow-sp__hlabel">{{ r.name }}</span>
            <span class="cow-sp__htrack"><span :style="{ width: `${(r.n / repoCounts[0].n) * 100}%` }" /></span>
            <span class="cow-sp__hn">{{ r.n }}</span>
          </button>
        </section>
        <section class="cow-sp__chart">
          <p class="cow-home__kicker">Specimens by decade collected</p>
          <div class="cow-sp__cols">
            <button
              v-for="d in decadeCounts"
              :key="d.decade"
              type="button"
              :class="['cow-sp__col', { 'is-on': decade === d.decade }]"
              :title="`${d.decade}s: ${d.n}`"
              @click="decade = decade === d.decade ? 0 : d.decade"
            >
              <b class="cow-sp__colnum">{{ d.n }}</b>
              <span
                class="cow-sp__colbar"
                :style="{ height: `${Math.max(4, (d.n / decadeMax) * 75)}%` }"
              />
              <small>{{ d.decade }}s</small>
            </button>
          </div>
          <p class="cow-sp__muted cow-sp__undated">
            <b>{{ specimens.length - undated }}</b> dated · <b>{{ undated }}</b> without a collecting date
          </p>
        </section>
      </div>

      <!-- tabs -->
      <div
        class="cow-hx__tabs cow-sp__tabs"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'spec'"
          :class="{ 'is-on': tab === 'spec' }"
          @click="tab = 'spec'"
        >
          Museum specimens <span>{{ specimens.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'lit'"
          :class="{ 'is-on': tab === 'lit' }"
          @click="tab = 'lit'"
        >
          Literature records <span>{{ citations.length }}</span>
        </button>
      </div>

      <!-- filters -->
      <div class="cow-sp__filters">
        <input
          v-model="q"
          type="search"
          :placeholder="tab === 'spec' ? 'Search name, catalogue number, collector, locality…' : 'Search name or reference…'"
          aria-label="Search records"
        />
        <select
          v-model="family"
          aria-label="Family"
        >
          <option value="">All families</option>
          <option
            v-for="f in families"
            :key="f"
            :value="f"
          >
            {{ f }}
          </option>
        </select>
        <select
          v-model="genus"
          aria-label="Genus"
        >
          <option value="">All genera</option>
          <option
            v-for="g in generaList"
            :key="g"
            :value="g"
          >
            {{ g }}
          </option>
        </select>
        <template v-if="tab === 'spec'">
          <select
            v-model="type"
            aria-label="Type status"
          >
            <option value="">Any status</option>
            <option value="any">Any type</option>
            <option
              v-for="t in typeKinds"
              :key="t"
              :value="t"
            >
              {{ t }}
            </option>
          </select>
          <label class="cow-at__check"><input
            v-model="withPhotos"
            type="checkbox"
          /> With photos</label>
        </template>
        <select
          v-else
          v-model="realm"
          aria-label="Realm"
        >
          <option value="">All realms</option>
          <option
            v-for="r in realms"
            :key="r"
            :value="r"
          >
            {{ r }}
          </option>
        </select>
        <button
          v-if="filtersOn"
          type="button"
          class="cow-ty__link"
          @click="reset"
        >
          Clear filters
        </button>
      </div>
      <p class="cow-sp__count">
        <span>{{ shown.length }} records</span>
        <button
          type="button"
          class="cow-ty__link"
          @click="downloadShown"
        >
          Download CSV (Darwin Core)
        </button>
        <a
          :href="fullDwc"
          class="cow-ty__link"
          target="_blank"
          rel="noopener"
          >Full Darwin Core file (all records, TSV)</a
        >
        <RouterLink
          to="/resources/tw/filter/dwc_otus"
          class="cow-ty__link"
          >Advanced search</RouterLink
        >
      </p>

      <!-- specimens: one compact row each -->
      <div
        v-if="tab === 'spec'"
        class="cow-ix__table-wrap"
      >
        <table class="cow-ix__table cow-sp__table">
          <thead>
            <tr>
              <th
                v-for="c in SORTS"
                v-show="(c.key !== 'place' || hasPlace) && (c.key !== 'who' || hasWho)"
                :key="c.key"
                :aria-sort="sortKey === c.key ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'"
              >
                <button
                  type="button"
                  :class="['cow-sp__sort', { 'is-on': sortKey === c.key }]"
                  @click="sortBy(c.key)"
                >
                  {{ c.label }}
                  <span aria-hidden="true">{{ sortKey === c.key ? (sortDir > 0 ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(r, i) in sortedSpecimens.slice(0, limit)"
              :key="r.key"
            >
            <tr
              v-if="sortKey === 'name' && (i === 0 || sortedSpecimens[i - 1].genus !== r.genus)"
              class="cow-sp__ghead"
            >
              <td :colspan="4 + (hasPlace ? 1 : 0) + (hasWho ? 1 : 0)">
                <i>{{ r.genus || 'Genus not recorded' }}</i>
                <span>{{ r.family }} · {{ genusCount[r.genus] }} specimen{{ genusCount[r.genus] === 1 ? '' : 's' }}</span>
              </td>
            </tr>
            <tr>
              <td class="cow-sp__tname">
                <RouterLink
                  v-if="r.otu_id"
                  :to="{ name: 'otus-id-overview', params: { id: String(r.otu_id) } }"
                  v-html="italic(r.scientificName)"
                />
                <span
                  v-else
                  v-html="italic(r.scientificName)"
                />
              </td>
              <td>
                <span
                  v-if="r.typeStatus"
                  :class="['cow-ty__badge', `is-${String(r.typeStatus).toLowerCase()}`]"
                  >{{ r.typeStatus }}</span
                >
              </td>
              <td class="cow-sp__tcat">
                <b>{{ r.institutionCode || '—' }}</b> {{ r.catalogNumber }}
              </td>
              <td
                v-if="hasPlace"
                class="cow-ix__muted cow-sp__tplace"
                :title="placeOf(r)"
              >
                {{ placeOf(r) }}
              </td>
              <td
                v-if="hasWho"
                class="cow-ix__muted"
              >
                {{ [r.recordedBy, r.year].filter(Boolean).join(', ') }}
              </td>
              <td>
                <RouterLink
                  v-if="r.associatedMedia && r.otu_id"
                  :to="{ name: 'otus-id-images', params: { id: String(r.otu_id) } }"
                  class="cow-sp__cam"
                  title="See photos"
                  aria-label="See photos"
                  >◉</RouterLink
                >
              </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- literature records -->
      <div
        v-if="tab === 'lit'"
        class="cow-ix__table-wrap"
      >
        <table class="cow-ix__table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Realm</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in shown.slice(0, limit)"
              :key="r.key"
            >
              <td>
                <RouterLink
                  v-if="r.otu_id"
                  :to="{ name: 'otus-id-overview', params: { id: String(r.otu_id) } }"
                  v-html="italic(r.scientificName)"
                />
                <span
                  v-else
                  v-html="italic(r.scientificName)"
                />
                <small>{{ r.family }}</small>
              </td>
              <td>{{ r.locality }}</td>
              <td
                class="cow-ix__muted"
                v-html="r.associatedReferences || ''"
              />
            </tr>
          </tbody>
        </table>
      </div>

      <button
        v-if="shown.length > limit"
        type="button"
        class="cow-ix__more"
        @click="limit += 100"
      >
        Show more ({{ shown.length - limit }} left)
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { loadDwc, csv, download, italic } from '../lib/dwc.js'

const { url: API, project_token: TOKEN } = __APP_ENV__
const fullDwc = `${API}/dwc_occurrences.csv?project_token=${TOKEN}`

const loading = ref(true)
const rows = ref([])
const tab = ref('spec')
const q = ref('')
const family = ref('')
const genus = ref('')
const type = ref('')
const realm = ref('')
const repo = ref('')
const decade = ref(0)
const withPhotos = ref(false)
const limit = ref(100)

onMounted(async () => {
  try {
    rows.value = (await loadDwc()).map((r, i) => ({ ...r, key: i }))
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})

// ceraphronoids only (the project also holds a few host specimens)
const CER = ['Ceraphronidae', 'Megaspilidae', 'Stigmaphronidae']
const specimens = computed(() => rows.value.filter((r) => r.basisOfRecord === 'PreservedSpecimen' && CER.includes(r.family)))
const citations = computed(() => rows.value.filter((r) => r.basisOfRecord === 'MaterialCitation' && CER.includes(r.family)))
const base = computed(() => (tab.value === 'spec' ? specimens.value : citations.value))
const families = computed(() => [...new Set(base.value.map((r) => r.family).filter(Boolean))].sort())
const generaList = computed(() =>
  [...new Set(base.value.filter((r) => !family.value || r.family === family.value).map((r) => r.genus).filter(Boolean))].sort()
)
const typeKinds = computed(() => [...new Set(specimens.value.map((r) => r.typeStatus).filter(Boolean))].sort())
const realms = computed(() => [...new Set(citations.value.map((r) => r.locality).filter(Boolean))].sort())

const tally = (list, f) => {
  const m = new Map()
  list.forEach((r) => {
    const k = f(r)
    if (k) m.set(k, (m.get(k) || 0) + 1)
  })
  return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)
}
const repoCounts = computed(() => tally(specimens.value, (r) => r.institutionCode))
const decadeCounts = computed(() =>
  tally(specimens.value, (r) => (r.year ? Math.floor(Number(r.year) / 10) * 10 : 0))
    .map((x) => ({ decade: x.name, n: x.n }))
    .sort((a, b) => a.decade - b.decade)
)
const decadeMax = computed(() => Math.max(1, ...decadeCounts.value.map((d) => d.n)))
const undated = computed(() => specimens.value.filter((r) => !r.year).length)

// sorting: taxon order by default, types first within a species
const SORTS = [
  { key: 'name', label: 'Species' },
  { key: 'type', label: 'Type' },
  { key: 'repo', label: 'Repository · number' },
  { key: 'place', label: 'Locality' },
  { key: 'who', label: 'Collected' }
]
const TYPE_RANK = { holotype: 0, neotype: 1, lectotype: 2, syntype: 3, paralectotype: 4, paratype: 5 }
const typeRank = (r) => (r.typeStatus ? TYPE_RANK[String(r.typeStatus).toLowerCase()] ?? 6 : 9)
const sortKey = ref('name')
const sortDir = ref(1)
function sortBy(k) {
  if (sortKey.value === k) sortDir.value = -sortDir.value
  else {
    sortKey.value = k
    sortDir.value = 1
  }
}
const cmp = (a, b) => String(a || '').localeCompare(String(b || ''), undefined, { numeric: true })
const sortedSpecimens = computed(() => {
  const d = sortDir.value
  const byName = (a, b) => cmp(a.genus, b.genus) || cmp(a.scientificName, b.scientificName) || typeRank(a) - typeRank(b) || cmp(a.catalogNumber, b.catalogNumber)
  const f = {
    name: byName,
    type: (a, b) => typeRank(a) - typeRank(b) || byName(a, b),
    repo: (a, b) => cmp(a.institutionCode, b.institutionCode) || cmp(a.catalogNumber, b.catalogNumber),
    place: (a, b) => (placeOf(a) ? 0 : 1) - (placeOf(b) ? 0 : 1) || cmp(placeOf(a), placeOf(b)) || byName(a, b),
    who: (a, b) => (a.year ? 0 : 1) - (b.year ? 0 : 1) || (Number(a.year) || 0) - (Number(b.year) || 0) || cmp(a.recordedBy, b.recordedBy)
  }[sortKey.value]
  return [...shown.value].sort((a, b) => d * f(a, b))
})
const genusCount = computed(() => {
  const m = {}
  shown.value.forEach((r) => (m[r.genus] = (m[r.genus] || 0) + 1))
  return m
})

const hasPlace = computed(() => shown.value.slice(0, limit.value).some((r) => placeOf(r)))
const hasWho = computed(() => shown.value.slice(0, limit.value).some((r) => r.recordedBy || r.year))
const placeOf = (r) => [r.country, r.stateProvince, r.verbatimLocality].filter(Boolean).join(', ').slice(0, 160)

const shown = computed(() => {
  const term = q.value.trim().toLowerCase()
  return base.value.filter((r) => {
    if (family.value && r.family !== family.value) return false
    if (genus.value && r.genus !== genus.value) return false
    if (tab.value === 'spec') {
      if (type.value === 'any' && !r.typeStatus) return false
      if (type.value && type.value !== 'any' && r.typeStatus !== type.value) return false
      if (withPhotos.value && !r.associatedMedia) return false
      if (repo.value && r.institutionCode !== repo.value) return false
      if (decade.value && (!r.year || Math.floor(Number(r.year) / 10) * 10 !== decade.value)) return false
    } else if (realm.value && r.locality !== realm.value) return false
    if (!term) return true
    return `${r.scientificName} ${r.catalogNumber} ${r.institutionCode} ${r.recordedBy} ${placeOf(r)} ${r.associatedReferences}`
      .toLowerCase()
      .includes(term)
  })
})

const filtersOn = computed(() => Boolean(q.value || family.value || genus.value || type.value || realm.value || repo.value || decade.value || withPhotos.value))
function reset() {
  q.value = family.value = genus.value = type.value = realm.value = repo.value = ''
  decade.value = 0
  withPhotos.value = false
}
watch([tab, q, family, genus, type, realm, repo, decade, withPhotos], () => (limit.value = 100))
watch(tab, () => {
  genus.value = ''
  realm.value = ''
})

function downloadShown() {
  download(
    csv(shown.value, [
      ['basisOfRecord', (r) => r.basisOfRecord],
      ['scientificName', (r) => r.scientificName],
      ['family', (r) => r.family],
      ['genus', (r) => r.genus],
      ['typeStatus', (r) => r.typeStatus],
      ['institutionCode', (r) => r.institutionCode],
      ['catalogNumber', (r) => r.catalogNumber],
      ['country', (r) => r.country],
      ['stateProvince', (r) => r.stateProvince],
      ['verbatimLocality', (r) => r.verbatimLocality],
      ['locality', (r) => r.locality],
      ['recordedBy', (r) => r.recordedBy],
      ['year', (r) => r.year],
      ['decimalLatitude', (r) => r.decimalLatitude],
      ['decimalLongitude', (r) => r.decimalLongitude],
      ['associatedReferences', (r) => String(r.associatedReferences || '').replace(/<[^>]+>/g, '')]
    ]),
    `ceraphronoidea-${tab.value === 'spec' ? 'specimens' : 'literature-records'}.csv`
  )
}
</script>
