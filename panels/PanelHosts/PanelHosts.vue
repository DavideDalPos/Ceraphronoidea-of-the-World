<template>
  <section class="cow-hx">
    <p
      v-if="loading"
      class="cow-hx__empty"
    >
      Loading host records…
    </p>

    <div
      v-else-if="!rows.length"
      class="cow-hx__empty"
    >
      <p>No host or association records for this taxon yet.</p>
      <RouterLink to="/interactions">Browse all host records →</RouterLink>
    </div>

    <template v-else>
      <!-- numbers -->
      <dl class="cow-hx__nums">
        <div v-if="hostCount">
          <dt>Host taxa</dt>
          <dd>{{ hostCount }}</dd>
        </div>
        <div v-if="familyCount">
          <dt>Host families</dt>
          <dd>{{ familyCount }}</dd>
        </div>
        <div v-if="orders.length">
          <dt>Host orders</dt>
          <dd>{{ orders.length }}</dd>
        </div>
        <div v-if="speciesCount > 1">
          <dt>Species with records</dt>
          <dd>{{ speciesCount }}</dd>
        </div>
        <div v-if="refs">
          <dt>References</dt>
          <dd>{{ refs }}</dd>
        </div>
      </dl>

      <!-- food web of this taxon -->
      <FoodWeb
        v-if="allRows.length && webAnimal"
        v-model:genus="webGenus"
        v-model:focus="webFocus"
        :rows="allRows"
        :keep="webKeep"
        :role-of="roleOf"
        :chips="false"
        class="cow-hx__web"
      />

      <!-- what kind of record -->
      <div
        class="cow-hx__tabs"
        role="tablist"
      >
        <button
          v-for="t in kinds"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="kind === t.key"
          :class="{ 'is-on': kind === t.key }"
          @click="setKind(t.key)"
        >
          {{ t.label }} <span>{{ t.n }}</span>
        </button>
      </div>

      <div class="cow-hx__body">
        <!-- host orders: overview and filter -->
        <aside
          v-if="kindOrders.length > 1"
          class="cow-hx__aside"
        >
          <p class="cow-hx__kicker">{{ kind === 'plants' ? 'Plant orders' : 'By order' }}</p>
          <button
            v-for="o in kindOrders"
            :key="o.name"
            type="button"
            :class="['cow-hx__ord', { 'is-on': order === o.name }]"
            :aria-pressed="order === o.name"
            @click="order = order === o.name ? '' : o.name"
          >
            <span class="cow-hx__ord-name">{{ o.name }}</span>
            <span class="cow-hx__ord-n">{{ o.n }}</span>
            <span class="cow-hx__ord-bar"><span :style="{ width: `${(o.n / kindOrders[0].n) * 100}%` }" /></span>
          </button>
          <button
            v-if="order"
            type="button"
            class="cow-hx__clear"
            @click="order = ''"
          >
            Show all orders
          </button>
        </aside>

        <!-- one card per host family -->
        <div class="cow-hx__grid">
          <article
            v-for="c in cards"
            :key="c.key"
            class="cow-hx__card"
          >
            <header>
              <p class="cow-hx__card-order">{{ c.order || 'Order not recorded' }}</p>
              <h3 class="cow-hx__card-fam">{{ c.family || 'Family not recorded' }}</h3>
              <span class="cow-hx__badge">{{ c.items.length }}</span>
            </header>
            <ul>
              <li
                v-for="h in openCards[c.key] ? c.items : c.items.slice(0, CARD_LIMIT)"
                :key="h.key"
              >
                <component
                  :is="h.link ? 'RouterLink' : 'span'"
                  class="cow-hx__host"
                  v-bind="h.link ? { to: h.link } : {}"
                  v-html="nameHtml(h.label)"
                />
                <span
                  v-if="h.by.length && speciesCount > 1"
                  class="cow-hx__by"
                >
                  <template
                    v-for="(b, i) in h.by"
                    :key="b.id"
                  >
                    <RouterLink
                      :to="{ name: 'otus-id-overview', params: { id: String(b.id) } }"
                      v-html="nameHtml(shortName(b.label))"
                    /><template v-if="i < h.by.length - 1">, </template>
                  </template>
                </span>
                <span
                  v-if="h.cits.length"
                  class="cow-hx__cit"
                  >{{ h.cits.join('; ') }}</span
                >
              </li>
            </ul>
            <button
              v-if="c.items.length > CARD_LIMIT"
              type="button"
              class="cow-hx__more"
              @click="openCards[c.key] = !openCards[c.key]"
            >
              {{ openCards[c.key] ? 'Show fewer' : `Show all ${c.items.length}` }}
            </button>
          </article>
        </div>
      </div>

      <footer class="cow-hx__foot">
        <span>Records from the literature, as entered in TaxonWorks.</span>
        <button
          type="button"
          @click="downloadCsv(rows, `host-records-${otuId}.csv`)"
        >
          Download CSV
        </button>
        <RouterLink to="/interactions">All Ceraphronoidea host records →</RouterLink>
      </footer>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { nameHtml, isCeraphronoid, downloadCsv, loadAssociations } from './associations.js'
import { useTaxonHosts } from './useTaxonHosts.js'
import FoodWeb from '../../components/hosts/FoodWeb.vue'
import { makeRoleOf } from '../../lib/roles.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})

const { loading, rows, asObject, animal, plants, refs, hostCount, familyCount, speciesCount, orders } = useTaxonHosts(props)
// food web: the species itself (focused, inside its genus), a genus, or a family
const allRows = ref([])
loadAssociations()
  .then((r) => (allRows.value = r))
  .catch(() => {})
const roleFn = computed(() => makeRoleOf(allRows.value))
const roleOf = (r) => roleFn.value(r)
const rankOf = computed(() => String(props.taxon?.rank || props.taxon?.rank_string || '').toLowerCase().split('::').pop())
const webAnimal = computed(() => animal.value.length > 0)
const webGenus = ref('')
const webFocus = ref('')
const webFamily = ref('')
watch(
  () => [props.otuId, rankOf.value, animal.value.length],
  () => {
    const r = rankOf.value
    const first = animal.value[0]?.s || {}
    webFamily.value = ''
    if (/species/.test(r)) {
      webGenus.value = first.genus || ''
      webFocus.value = String(props.otuId)
    } else if (/genus/.test(r)) {
      webGenus.value = props.taxon?.name || first.genus || ''
      webFocus.value = ''
    } else {
      webGenus.value = ''
      webFocus.value = ''
      if (/family/.test(r) && !/super/.test(r)) webFamily.value = props.taxon?.name || ''
    }
  },
  { immediate: true }
)
const webKeep = (r) => !webFamily.value || r.s.family === webFamily.value
const CARD_LIMIT = 12
const openCards = reactive({})
const kind = ref('hosts')
const order = ref('')

// "Dendrocerus carpenteri (Curtis, 1829)" → "D. carpenteri"
const shortName = (l) => {
  const m = String(l).match(/^([A-Z])[a-z]+\s+(?:\([A-Za-z]+\)\s+)?([a-z][a-z-]+)/)
  return m ? `${m[1]}. ${m[2]}` : l
}

const kinds = computed(() =>
  [
    { key: 'hosts', label: 'Hosts & prey', n: new Set(animal.value.map((r) => r.o.id || r.o.label)).size },
    { key: 'plants', label: 'Plants', n: new Set(plants.value.map((r) => r.o.id || r.o.label)).size },
    { key: 'attackers', label: 'Recorded as host', n: new Set(asObject.value.map((r) => r.s.id || r.s.label)).size }
  ].filter((k) => k.n)
)
watch(kinds, (ks) => {
  if (ks.length && !ks.find((k) => k.key === kind.value)) kind.value = ks[0].key
})
function setKind(k) {
  kind.value = k
  order.value = ''
}

// records of the chosen kind, seen from the partner's side
const partnerRows = computed(() => {
  if (kind.value === 'attackers') return asObject.value.map((r) => ({ r, p: r.s, me: r.o }))
  const list = kind.value === 'plants' ? plants.value : animal.value
  return list.map((r) => ({ r, p: r.o, me: r.s }))
})

const kindOrders = computed(() => {
  if (kind.value === 'hosts') return orders.value
  const m = new Map()
  partnerRows.value.forEach(({ p }) => m.set(p.order || 'Order not recorded', (m.get(p.order || 'Order not recorded') || 0) + 1))
  return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)
})
const orderRank = computed(() => Object.fromEntries(kindOrders.value.map((o, i) => [o.name, i])))

const cards = computed(() => {
  const partners = new Map()
  partnerRows.value
    .filter(({ p }) => !order.value || (p.order || 'Order not recorded') === order.value)
    .forEach(({ r, p, me }) => {
      const k = p.id || p.label
      if (!partners.has(k)) {
        partners.set(k, {
          key: k,
          label: p.label,
          order: p.order,
          family: p.family,
          link: isCeraphronoid(p) && p.id ? { name: 'otus-id-overview', params: { id: String(p.id) } } : null,
          by: new Map(),
          cits: new Set()
        })
      }
      const e = partners.get(k)
      if (me.id) e.by.set(me.id, { id: me.id, label: me.label })
      if (r.cit) r.cit.split(/;\s*/).forEach((c) => c && e.cits.add(c))
    })
  const fams = new Map()
  ;[...partners.values()].forEach((h) => {
    const fk = `${h.order}|${h.family}`
    if (!fams.has(fk)) fams.set(fk, { key: fk, order: h.order, family: h.family, items: [] })
    fams.get(fk).items.push({ ...h, by: [...h.by.values()], cits: [...h.cits] })
  })
  return [...fams.values()]
    .map((f) => ({ ...f, items: f.items.sort((a, b) => a.label.localeCompare(b.label)) }))
    .sort(
      (a, b) =>
        (orderRank.value[a.order || 'Order not recorded'] ?? 99) - (orderRank.value[b.order || 'Order not recorded'] ?? 99) ||
        b.items.length - a.items.length ||
        String(a.family).localeCompare(String(b.family))
    )
})
</script>
