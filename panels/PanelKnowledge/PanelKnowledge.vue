<template>
  <section class="cow-pk">
    <div class="cow-pk__head">
      <div>
        <p class="cow-pk__kicker">
          What we know
        </p>
        <p class="cow-pk__score">
          <b>{{ have }}</b> of {{ items.length }} kinds of data
        </p>
      </div>
      <svg
        class="cow-pk__ring"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          class="bg"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          class="fg"
          :style="{ strokeDasharray: `${(have / items.length) * 113.1} 113.1` }"
        />
      </svg>
    </div>
    <ul class="cow-pk__list">
      <li
        v-for="it in items"
        :key="it.label"
        :class="{ 'is-yes': it.n > 0, 'is-no': it.n === 0, 'is-wait': it.n === null }"
      >
        <span class="cow-pk__mark">{{ it.n === null ? '·' : it.n > 0 ? '✓' : '–' }}</span>
        <component
          :is="it.to && it.n ? 'RouterLink' : 'span'"
          :to="it.to"
          class="cow-pk__label"
        >
          {{ it.label }}
        </component>
        <span class="cow-pk__n">{{ it.n === null ? '' : it.n > 0 ? (it.text || fmt(it.n)) : 'none yet' }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { loadDwc } from '../../lib/dwc.js'
import { loadAssociations, matcher } from '../PanelHosts/associations.js'
import { canonicalOf, rankOf, inScope, otuImages, loadKeys, gbifOf } from '../../lib/taxonPage.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxonId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})
const fmt = (n) => Number(n || 0).toLocaleString()
const id = () => String(props.otuId)
const tab = (t) => ({ name: `otus-id-${t}`, params: { id: id() } })

const items = reactive([
  { key: 'img', label: 'Images', n: null, to: null },
  { key: 'type', label: 'Type specimens', n: null, to: null },
  { key: 'spec', label: 'Specimen records', n: null, to: null },
  { key: 'host', label: 'Host records', n: null, to: null },
  { key: 'dist', label: 'Distribution records', n: null, to: null },
  { key: 'refs', label: 'References', n: null, to: null },
  { key: 'key', label: 'Identification key', n: null, to: '/keys' },
  { key: 'gbif', label: 'GBIF occurrences', n: null, to: null }
])
const set = (k, n, extra = {}) => Object.assign(items.find((x) => x.key === k), { n }, extra)
const have = computed(() => items.filter((x) => x.n > 0).length)

async function load() {
  items.forEach((x) => (x.n = null))
  const name = canonicalOf(props.taxon)
  const rank = rankOf(props.taxon)
  otuImages(props.otuId).then((l) => set('img', l.length, { to: tab('images') }))
  loadDwc()
    .then((rows) => {
      const mine = rows.filter(inScope(props.otuId, props.taxon))
      const spec = mine.filter((r) => r.basisOfRecord === 'PreservedSpecimen')
      set('type', spec.filter((r) => r.typeStatus).length, { to: tab('specimens') })
      set('spec', spec.length, { to: tab('specimens') })
      set('dist', mine.filter((r) => r.basisOfRecord === 'MaterialCitation').length, { to: '/atlas' })
    })
    .catch(() => ['type', 'spec', 'dist'].forEach((k) => set(k, 0)))
  loadAssociations()
    .then((rows) => {
      const m = matcher(props.otuId, props.taxon)
      set('host', rows.filter((r) => m(r.s)).length, { to: tab('hosts') })
    })
    .catch(() => set('host', 0))
  if (props.taxonId) {
    makeAPIRequest
      .get(`/taxon_names/${props.taxonId}/inventory/catalog`)
      .then(({ data }) => set('refs', (data?.sources || []).length, { to: tab('literature') }))
      .catch(() => set('refs', 0))
  } else set('refs', 0)
  loadKeys().then((keys) => {
    const genus = name.split(' ')[0]
    const epithet = name.split(' ')[1]
    const fit = keys.filter((k) => (epithet && k.text.includes(name)) || (epithet && k.text.includes(`${genus.charAt(0)}. ${epithet}`)) || k.scope === genus || (/species|genus/.test(rank) && k.scope === 'Ceraphronoidea'))
    set('key', fit.length, { text: fit.length === 1 ? '1 key' : `${fit.length} keys` })
  })
  gbifOf(name).then((g) => set('gbif', g?.occ || 0, { to: null }))
}
watch(() => [props.otuId, props.taxonId], load, { immediate: true })
</script>
