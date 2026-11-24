<template>
  <div class="cow-ix">
    <p
      v-if="loading"
      class="cow-ix__status"
    >
      Loading host records…
    </p>
    <p
      v-else-if="error"
      class="cow-ix__status"
    >
      Host records could not be loaded.
    </p>

    <template v-else>
      <!-- Numbers -->
      <dl class="cow-ix__stats">
        <div>
          <dt>Host &amp; prey records</dt>
          <dd>{{ fmt(attacks.length) }}</dd>
        </div>
        <div>
          <dt>Ceraphronoid species with hosts</dt>
          <dd>{{ fmt(count(attacks, (r) => r.s.id)) }}</dd>
        </div>
        <div>
          <dt>Host taxa</dt>
          <dd>{{ fmt(count(attacks, (r) => r.o.id || r.o.label)) }}</dd>
        </div>
        <div>
          <dt>Host families</dt>
          <dd>{{ fmt(count(attacks, (r) => r.o.family)) }}</dd>
        </div>
        <div v-if="plants.length">
          <dt>Plant records</dt>
          <dd>{{ fmt(plants.length) }}</dd>
        </div>
        <div>
          <dt>References</dt>
          <dd>{{ fmt(refCount) }}</dd>
        </div>
      </dl>

      <!-- Genera: what they attack -->
      <section class="cow-ix__block">
        <h2 class="cow-ix__h2">What each genus attacks</h2>
        <p class="cow-ix__help">
          Host and prey records per genus, split by host order. Click a bar segment to list those records.
        </p>
        <ul
          class="cow-ix__legend"
          aria-label="Host orders"
        >
          <li
            v-for="o in legendOrders"
            :key="o"
          >
            <button
              type="button"
              :class="{ 'is-on': order === o }"
              @click="order = order === o ? '' : o"
            >
              <span
                class="cow-ix__sw"
                :style="{ background: colorOf(o) }"
              />{{ o }}
            </button>
          </li>
        </ul>
        <div class="cow-ix__bars">
          <div
            v-for="g in heatGenera"
            :key="g.name"
            :class="['cow-ix__brow', { 'is-dim': genus && genus !== g.name }]"
          >
            <button
              type="button"
              class="cow-ix__gname"
              @click="pickCell(g.name, '')"
            >
              <i>{{ g.name }}</i>
              <small>{{ g.family }}</small>
            </button>
            <div class="cow-ix__track">
              <button
                v-for="seg in segments(g.name)"
                :key="seg.order"
                type="button"
                :class="['cow-ix__seg', { 'is-on': genus === g.name && order === seg.order }]"
                :style="{ width: `${(seg.n / barMax) * 100}%`, background: colorOf(seg.order) }"
                :title="`${g.name} on ${seg.order}: ${seg.n} record${seg.n === 1 ? '' : 's'}`"
                @click="pickCell(g.name, seg.order)"
              >
                <span v-if="seg.n / barMax > 0.06">{{ seg.n }}</span>
              </button>
            </div>
            <span class="cow-ix__total">{{ g.n }}</span>
          </div>
        </div>
      </section>

      <FoodWeb
        :rows="all"
        class="cow-ix__block"
      />

      <!-- Records -->
      <section
        ref="listEl"
        class="cow-ix__block"
      >
        <h2 class="cow-ix__h2">Host records</h2>
        <div class="cow-ix__tools">
          <input
            v-model="q"
            type="search"
            class="cow-ix__search"
            placeholder="Search a ceraphronoid, a host or a reference"
            aria-label="Search host records"
          />
          <select
            v-model="rel"
            aria-label="Relationship"
          >
            <option value="">All relationships</option>
            <option
              v-for="r in relationships"
              :key="r"
              :value="r"
            >
              {{ r }}
            </option>
          </select>
          <select
            v-model="family"
            aria-label="Ceraphronoid family"
          >
            <option value="">Both families</option>
            <option
              v-for="f in families"
              :key="f"
              :value="f"
            >
              {{ f }}
            </option>
          </select>
          <select
            v-model="order"
            aria-label="Host order"
          >
            <option value="">All host orders</option>
            <option
              v-for="o in allOrders"
              :key="o"
              :value="o"
            >
              {{ o }}
            </option>
          </select>
          <button
            v-if="genus"
            type="button"
            class="cow-ix__pill"
            @click="genus = ''"
          >
            <i>{{ genus }}</i> ✕
          </button>
          <button
            v-if="filtersOn"
            type="button"
            class="cow-ix__link"
            @click="reset"
          >
            Clear filters
          </button>
        </div>
        <p class="cow-ix__count">
          {{ fmt(shown.length) }} record{{ shown.length === 1 ? '' : 's' }}
          <button
            type="button"
            class="cow-ix__link"
            @click="downloadCsv(shown, 'ceraphronoidea-host-records.csv')"
          >
            Download CSV
          </button>
        </p>

        <div class="cow-ix__table-wrap">
          <table class="cow-ix__table">
            <thead>
              <tr>
                <th>Ceraphronoid</th>
                <th>Relationship</th>
                <th>Host</th>
                <th>Host order: family</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in shown.slice(0, limit)"
                :key="r.id"
              >
                <td>
                  <RouterLink
                    v-if="r.s.id"
                    :to="{ name: 'otus-id-overview', params: { id: String(r.s.id) } }"
                    v-html="nameHtml(r.s.label)"
                  />
                  <small>{{ r.s.family }}</small>
                </td>
                <td>{{ r.rel }}</td>
                <td>
                  <RouterLink
                    v-if="isCeraphronoid(r.o) && r.o.id"
                    :to="{ name: 'otus-id-overview', params: { id: String(r.o.id) } }"
                    v-html="nameHtml(r.o.label)"
                  />
                  <span
                    v-else
                    v-html="nameHtml(r.o.label)"
                  />
                </td>
                <td class="cow-ix__muted">{{ r.o.order }}<template v-if="r.o.family">: {{ r.o.family }}</template></td>
                <td class="cow-ix__muted">{{ r.cit }}</td>
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
          Show more ({{ fmt(shown.length - limit) }} left)
        </button>
        <p class="cow-ix__note">
          Records are host associations entered in TaxonWorks from the cited literature. Some names in older papers
          may refer to misidentified hosts; check the reference before reusing a record.
        </p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  loadAssociations,
  isCeraphronoid,
  nameHtml,
  downloadCsv
} from '../panels/PanelHosts/associations.js'
import FoodWeb from './hosts/FoodWeb.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref(false)
const all = ref([])
const q = ref(String(route.query.q || ''))
const rel = ref(String(route.query.rel || ''))
const family = ref(String(route.query.family || ''))
const order = ref(String(route.query.order || ''))
const genus = ref(String(route.query.genus || ''))
const limit = ref(100)
const listEl = ref(null)

const fmt = (n) => Number(n || 0).toLocaleString()
const count = (rows, f) => new Set(rows.map(f).filter(Boolean)).size

onMounted(async () => {
  try {
    all.value = await loadAssociations()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

// records where a ceraphronoid is the subject (parasitoid, predator…)
const core = computed(() => all.value.filter((r) => isCeraphronoid(r.s)))
// animal hosts and prey vs plants ("feeds on": adults recorded on plants)
const attacks = computed(() => core.value.filter((r) => r.rel !== 'feeds on'))
const plants = computed(() => core.value.filter((r) => r.rel === 'feeds on'))
const refCount = computed(() => count(core.value.flatMap((r) => (r.cit ? r.cit.split(/;\s*/) : [])), (x) => x))
const relationships = computed(() => [...new Set(core.value.map((r) => r.rel))].sort())
const families = computed(() => [...new Set(core.value.map((r) => r.s.family))].filter(Boolean).sort())
const allOrders = computed(() => [...new Set(core.value.map((r) => r.o.order))].filter(Boolean).sort())

// heat table: genera with records, orders by number of records
const heat = computed(() => {
  const m = new Map()
  attacks.value.forEach((r) => {
    const g = r.s.genus || '—'
    const o = r.o.order || 'Order not recorded'
    const k = `${g}|${o}`
    m.set(k, (m.get(k) || 0) + 1)
  })
  return m
})
const cell = (g, o) => heat.value.get(`${g}|${o}`) || 0
const heatMax = computed(() => Math.max(1, ...heat.value.values()))
const heatOrders = computed(() => {
  const m = new Map()
  attacks.value.forEach((r) => m.set(r.o.order || 'Order not recorded', (m.get(r.o.order || 'Order not recorded') || 0) + 1))
  return [...m].sort((a, b) => b[1] - a[1]).map(([o]) => o)
})
const heatGenera = computed(() => {
  const m = new Map()
  attacks.value.forEach((r) => {
    const g = r.s.genus || '—'
    if (!m.has(g)) m.set(g, { name: g, family: r.s.family, n: 0 })
    m.get(g).n++
  })
  return [...m.values()].sort((a, b) => b.n - a.n)
})

// host orders: the six biggest get their own colour, the rest share grey
const PALETTE = ['#6c5240', '#74866a', '#b0562b', '#3f6f8a', '#c49a3a', '#8a5a83']
const OTHER = 'Other orders'
const legendOrders = computed(() => {
  const main = heatOrders.value.slice(0, PALETTE.length)
  return heatOrders.value.length > main.length ? [...main, OTHER] : main
})
const colorOf = (o) => {
  const i = heatOrders.value.slice(0, PALETTE.length).indexOf(o)
  return i >= 0 ? PALETTE[i] : '#a39b90'
}
function segments(g) {
  const main = heatOrders.value.slice(0, PALETTE.length)
  const out = main.map((o) => ({ order: o, n: cell(g, o) })).filter((x) => x.n)
  const rest = heatOrders.value.slice(PALETTE.length).reduce((n, o) => n + cell(g, o), 0)
  if (rest) out.push({ order: OTHER, n: rest })
  return out
}
const barMax = computed(() => Math.max(1, ...heatGenera.value.map((g) => g.n)))

async function pickCell(g, o) {
  const same = genus.value === g && order.value === o
  genus.value = same ? '' : g
  order.value = same ? '' : o
  await nextTick()
  listEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const shown = computed(() => {
  const term = q.value.trim().toLowerCase()
  return core.value
    .filter(
      (r) =>
        (!rel.value || r.rel === rel.value) &&
        (!family.value || r.s.family === family.value) &&
        (!order.value ||
          (order.value === OTHER ? !heatOrders.value.slice(0, PALETTE.length).includes(r.o.order || 'Order not recorded') : r.o.order === order.value)) &&
        (!genus.value || r.s.genus === genus.value) &&
        (!term || `${r.s.label} ${r.o.label} ${r.o.family} ${r.o.order} ${r.cit}`.toLowerCase().includes(term))
    )
    .sort((a, b) => a.s.label.localeCompare(b.s.label) || a.o.label.localeCompare(b.o.label))
})

const filtersOn = computed(() => Boolean(q.value || rel.value || family.value || order.value || genus.value))
function reset() {
  q.value = rel.value = family.value = order.value = genus.value = ''
}

// keep filters in the URL so a view can be shared
watch([q, rel, family, order, genus], () => {
  limit.value = 100
  const query = Object.fromEntries(
    Object.entries({ q: q.value, rel: rel.value, family: family.value, order: order.value, genus: genus.value }).filter(([, v]) => v)
  )
  router.replace({ query })
})
</script>
