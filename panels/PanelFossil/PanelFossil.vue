<template>
  <section
    v-if="list.length"
    class="cow-pf"
  >
    <p class="cow-pf__kicker">
      Fossil record
    </p>
    <div class="cow-pf__bar">
      <span
        v-for="p in PERIODS"
        :key="p.name"
        class="cow-pf__period"
        :style="{ left: `${pos(Math.min(p.from, MAX))}%`, width: `${pos(p.to) - pos(Math.min(p.from, MAX))}%`, background: p.color }"
        :title="p.name"
      />
      <span
        v-for="s in placed"
        :key="s.id"
        class="cow-pf__dot"
        :style="{ left: `${pos(s.dep.age)}%` }"
        :title="`${s.name}: ${s.dep.name}, ~${s.dep.age} Ma`"
      />
    </div>
    <div class="cow-pf__axis">
      <span>140 Ma</span><span>K–Pg 66</span><span>today</span>
    </div>
    <ul class="cow-pf__list">
      <li
        v-for="s in list"
        :key="s.id"
      >
        <span class="cow-pf__dagger">†</span>
        <span><i>{{ s.name }}</i> {{ s.author }}</span>
        <small v-if="s.dep">{{ s.dep.name }} · ~{{ s.dep.age || '<0.1' }} Ma</small>
      </li>
    </ul>
    <RouterLink
      to="/fossils"
      class="cow-pf__all"
    >
      All fossils on the timeline →
    </RouterLink>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxonId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})

// same deposits as the Fossils page (ages approximate)
const DEPOSITS = {
  lebanese: { name: 'Lebanese amber', age: 127 },
  baissa: { name: 'Baissa', age: 130 },
  bontsagan: { name: 'Bon-Tsagan', age: 120 },
  spanish: { name: 'Spanish amber', age: 105 },
  burmese: { name: 'Burmese amber', age: 99 },
  taimyr: { name: 'Taimyr amber', age: 85 },
  canadian: { name: 'Canadian amber', age: 78 },
  baltic: { name: 'Baltic amber', age: 42 },
  copal: { name: 'East African copal', age: 0 }
}
const DEP = {
  'Allocotidus bruesi': 'canadian', 'Aphrostigmon bontsaganicum': 'bontsagan', 'Aphrostigmon priapulus': 'bontsagan', 'Aphrostigmon vitimense': 'baissa',
  'Burmaphron iratxoak': 'burmese', 'Burmaphron jentilak': 'burmese', 'Burmaphron sorginak': 'burmese', 'Elasmomorpha melpomene': 'taimyr',
  'Hippocoon evadne': 'taimyr', 'Hippocoon basajauni': 'spanish', 'Libanophron sugaar': 'lebanese', 'Stigmaphron orphne': 'taimyr',
  'Tagsmiphron exitorum': 'canadian', 'Tagsmiphron leucki': 'canadian', 'Tagsmiphron spiculum': 'canadian', 'Tagsmiphron olentzero': 'spanish',
  'Prolagynodes penniger': 'taimyr', 'Conostigmus dolicharthrus': 'taimyr', 'Dendrocerus dubitatus': 'canadian', 'Lagynodes electriphilus': 'baltic',
  'Lagynodes primordialis': 'baltic', 'Lagynodes pseudocarinatus': 'baltic', 'Conostigmus juvenilis': 'baltic', 'Conostigmus resinae': 'baltic',
  'Conostigmus succinalis': 'baltic', 'Ceraphron fasciatus': 'copal', 'Aphanogmus serrulatus': 'copal'
}
const PERIODS = [
  { name: 'Early Cretaceous', from: 145, to: 100.5, color: '#8CCD57' },
  { name: 'Late Cretaceous', from: 100.5, to: 66, color: '#A6D84A' },
  { name: 'Paleogene', from: 66, to: 23, color: '#FD9A52' },
  { name: 'Neogene', from: 23, to: 2.6, color: '#FFE619' },
  { name: 'Quaternary', from: 2.6, to: 0, color: '#F9F97F' }
]
const MAX = 140
const pos = (ma) => ((MAX - ma) / MAX) * 100

const list = ref([])
const placed = computed(() => list.value.filter((s) => s.dep))

async function load() {
  list.value = []
  if (!props.taxonId) return
  try {
    const p = { 'taxon_name_id[]': props.taxonId, descendants: true, per: 200 }
    const [fos, own] = await Promise.all([
      makeAPIRequest.get('/taxon_names', { params: { ...p, 'taxon_name_classification[]': 'TaxonNameClassification::Iczn::Fossil' } }),
      makeAPIRequest.get('/taxon_names', { params: p })
    ])
    // species tagged as fossil, plus species with a known deposit (some are not tagged yet)
    const m = new Map()
    ;[...(fos.data || []), ...(own.data || []).filter((t) => DEP[t.cached])]
      .filter((t) => String(t.rank_string || '').endsWith('Species'))
      .forEach((t) => m.set(t.id, { id: t.id, name: t.cached, author: t.cached_author_year || '', dep: DEPOSITS[DEP[t.cached]] || null }))
    list.value = [...m.values()].sort((a, b) => (b.dep?.age ?? -1) - (a.dep?.age ?? -1) || a.name.localeCompare(b.name)).slice(0, 30)
  } catch {
    list.value = []
  }
}
watch(() => props.taxonId, load, { immediate: true })
</script>
