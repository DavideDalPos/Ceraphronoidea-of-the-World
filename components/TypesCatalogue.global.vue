<template>
  <div class="cow-ty">
    <p
      v-if="loading"
      class="cow-ty__muted"
    >
      Loading type specimens…
    </p>
    <template v-else>
      <dl class="cow-ix__stats cow-ty__stats">
        <div
          v-for="k in kinds"
          :key="k.name"
        >
          <dt>{{ k.name }}s</dt>
          <dd>{{ k.n }}</dd>
        </div>
        <div>
          <dt>Repositories</dt>
          <dd>{{ repos.length }}</dd>
        </div>
      </dl>

      <div class="cow-ty__layout">
        <!-- repositories -->
        <aside class="cow-ty__aside">
          <p class="cow-ty__kicker">Repositories</p>
          <button
            type="button"
            :class="['cow-ty__repo', { 'is-on': !repo }]"
            @click="repo = ''"
          >
            <span>All</span><span>{{ types.length }}</span>
          </button>
          <button
            v-for="r in repos"
            :key="r.code"
            type="button"
            :class="['cow-ty__repo', { 'is-on': repo === r.code }]"
            @click="repo = repo === r.code ? '' : r.code"
          >
            <span>{{ r.code }}</span><span>{{ r.n }}</span>
          </button>
        </aside>

        <section>
          <div class="cow-ty__tools">
            <input
              v-model="q"
              type="search"
              placeholder="Search a name or catalogue number…"
              aria-label="Search types"
            />
            <div class="cow-ty__kinds">
              <button
                v-for="k in ['All', ...kinds.map((x) => x.name)]"
                :key="k"
                type="button"
                :class="{ 'is-on': kind === k }"
                @click="kind = k"
              >
                {{ k }}
              </button>
            </div>
            <button
              type="button"
              class="cow-ty__link"
              @click="downloadTypes"
            >
              Download CSV
            </button>
          </div>
          <p class="cow-ty__muted">{{ shown.length }} type specimens</p>
          <div class="cow-ty__grid">
            <article
              v-for="t in shown"
              :key="t.key"
              class="cow-ty__card"
            >
              <span :class="['cow-ty__badge', `is-${t.kind}`]">{{ t.kind }}</span>
              <RouterLink
                v-if="t.otu"
                class="cow-ty__name"
                :to="{ name: 'otus-id-overview', params: { id: String(t.otu) } }"
                v-html="italic(t.name)"
              />
              <span
                v-else
                class="cow-ty__name"
                v-html="italic(t.name)"
              />
              <p class="cow-ty__meta">
                <b>{{ t.repo || 'Repository not recorded' }}</b>
                <template v-if="t.cat"> · {{ t.cat }}</template>
              </p>
              <p
                v-if="t.where"
                class="cow-ty__where"
              >
                {{ t.where }}
              </p>
            </article>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { loadDwc, csv, download, italic } from '../lib/dwc.js'

const KIND_ORDER = ['holotype', 'lectotype', 'neotype', 'syntype', 'paratype', 'paralectotype']
const loading = ref(true)
const rows = ref([])
const q = ref('')
const kind = ref('All')
const repo = ref('')

onMounted(async () => {
  try {
    rows.value = await loadDwc()
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})

const types = computed(() =>
  rows.value
    .filter((r) => r.typeStatus)
    .map((r, i) => ({
      key: i,
      kind: String(r.typeStatus).toLowerCase().split(/[\s;|]/)[0],
      name: r.scientificName || '(name not recorded)',
      otu: r.otu_id,
      repo: r.institutionCode || '',
      cat: r.catalogNumber || '',
      where: [r.country, r.stateProvince, r.verbatimLocality].filter(Boolean).join(', ').slice(0, 140)
    }))
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.name.localeCompare(b.name))
)
const kinds = computed(() => {
  const m = new Map()
  types.value.forEach((t) => m.set(t.kind, (m.get(t.kind) || 0) + 1))
  return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => KIND_ORDER.indexOf(a.name) - KIND_ORDER.indexOf(b.name))
})
const repos = computed(() => {
  const m = new Map()
  types.value.forEach((t) => m.set(t.repo || '—', (m.get(t.repo || '—') || 0) + 1))
  return [...m].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n)
})
const shown = computed(() => {
  const term = q.value.trim().toLowerCase()
  return types.value.filter(
    (t) =>
      (kind.value === 'All' || t.kind === kind.value) &&
      (!repo.value || (t.repo || '—') === repo.value) &&
      (!term || `${t.name} ${t.cat} ${t.repo}`.toLowerCase().includes(term))
  )
})

function downloadTypes() {
  download(
    csv(shown.value, [
      ['Type', (t) => t.kind],
      ['Name', (t) => t.name],
      ['Repository', (t) => t.repo],
      ['Catalogue number', (t) => t.cat],
      ['Locality', (t) => t.where]
    ]),
    'ceraphronoidea-types.csv'
  )
}
</script>
