<template>
  <section class="cow-pl">
    <p
      v-if="loading"
      class="cow-pp__empty"
    >
      Loading references…
    </p>
    <template v-else>
      <div class="cow-pl__head">
        <p class="cow-pp__nums">
          <b>{{ refs.length }}</b> reference{{ refs.length === 1 ? '' : 's' }}
          <template v-if="span">
            · {{ span }}
          </template>
        </p>
        <div class="cow-ty2__seg">
          <button
            v-for="r in ROLES"
            :key="r.key"
            type="button"
            :class="{ 'is-on': role === r.key }"
            @click="role = r.key"
          >
            {{ r.label }} <small>{{ r.key === 'all' ? refs.length : refs.filter((x) => x.roles.has(r.key)).length }}</small>
          </button>
        </div>
      </div>
      <p
        v-if="!shown.length"
        class="cow-pp__empty"
      >
        No references of this kind yet.
      </p>
      <ol class="cow-pl__list">
        <li
          v-for="r in shown"
          :key="r.key"
        >
          <span class="cow-pl__year">{{ r.year || 'n.d.' }}</span>
          <div>
            <p
              class="cow-pl__text"
              v-html="r.html"
            />
            <p class="cow-pl__meta">
              <span
                v-for="t in [...r.roles]"
                :key="t"
                :class="['cow-pl__tag', `is-${t}`]"
              >{{ ROLE_LABEL[t] }}</span>
              <a
                v-if="r.doi"
                :href="`https://doi.org/${r.doi}`"
                target="_blank"
                rel="noopener"
              >doi:{{ r.doi }}</a>
              <RouterLink :to="{ path: '/literature', query: { q: r.query } }">
                In Literature
              </RouterLink>
            </p>
          </div>
        </li>
      </ol>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { loadDwc } from '../../lib/dwc.js'
import { loadAssociations, matcher } from '../PanelHosts/associations.js'
import { inScope } from '../../lib/taxonPage.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxonId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})
const ROLES = [
  { key: 'all', label: 'All' },
  { key: 'names', label: 'Nomenclature' },
  { key: 'hosts', label: 'Hosts' },
  { key: 'dist', label: 'Distribution' }
]
const ROLE_LABEL = { names: 'Nomenclature', hosts: 'Hosts', dist: 'Distribution' }
const role = ref('all')
const loading = ref(true)
const refs = ref([])

const clean = (s) =>
  String(s || '')
    .replace(/\\textit\s*/g, '')
    .replace(/\s*\[in [^\]]*\]/g, '')
    .replace(/\s*https?:\/\/(dx\.)?doi\.org\/\S+\s*$/, '')
    .trim()
const yearOf = (t) => Number((String(t).match(/\((\d{4})[a-z]?\)/) || String(t).match(/\b(1[7-9]\d\d|20\d\d)\b/) || [])[1]) || 0
const plain = (h) => String(h).replace(/<[^>]+>/g, '')
const queryOf = (h) => {
  const t = plain(h)
  const author = t.split(/[,(]/)[0].trim()
  const y = yearOf(t)
  return `${author} ${y || ''}`.trim()
}

async function load() {
  loading.value = true
  const m = new Map()
  const add = (key, html, role, extra = {}) => {
    if (!html) return
    if (!m.has(key)) m.set(key, { key, html: clean(html), roles: new Set(), year: extra.year || yearOf(plain(html)), doi: extra.doi || '' })
    m.get(key).roles.add(role)
  }
  const doiOf = (s) => String(s?.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
  // 1. nomenclature: the catalogue of the name
  try {
    if (props.taxonId) {
      const { data } = await makeAPIRequest.get(`/taxon_names/${props.taxonId}/inventory/catalog`)
      ;(data?.sources || []).forEach((s) => add(`s${s.id}`, s.cached || s.label, 'names', { year: Number(s.year) || 0, doi: doiOf(s) }))
    }
  } catch {
    /* none */
  }
  // 2. hosts: the sources of the association records
  try {
    const all = await loadAssociations()
    const mine = matcher(props.otuId, props.taxon)
    const ids = all.filter((r) => mine(r.s) || mine(r.o)).map((r) => r.id).slice(0, 300)
    for (let i = 0; i < ids.length; i += 100) {
      const { data } = await makeAPIRequest.get('/citations', {
        params: { citation_object_type: 'BiologicalAssociation', citation_object_id: ids.slice(i, i + 100), extend: ['source'], per: 1000 }
      })
      ;(data || []).forEach((c) => add(`s${c.source_id}`, c.source?.label || c.citation_source_body, 'hosts', { year: Number(c.source?.year) || 0, doi: doiOf(c.source) }))
    }
  } catch {
    /* none */
  }
  // 3. distribution: references of the literature records
  try {
    const rows = (await loadDwc()).filter((r) => r.basisOfRecord === 'MaterialCitation').filter(inScope(props.otuId, props.taxon))
    const seen = new Set([...m.values()].map((x) => plain(x.html).slice(0, 45).toLowerCase()))
    rows.forEach((r) =>
      String(r.associatedReferences || '')
        .split(/\s*\|\s*/)
        .filter(Boolean)
        .forEach((h) => {
          const k = plain(h).slice(0, 45).toLowerCase()
          const hit = [...m.values()].find((x) => plain(x.html).slice(0, 45).toLowerCase() === k)
          if (hit) hit.roles.add('dist')
          else if (!seen.has(k)) {
            seen.add(k)
            add(`d${k}`, h, 'dist')
          }
        })
    )
  } catch {
    /* none */
  }
  refs.value = [...m.values()].map((r) => ({ ...r, query: queryOf(r.html) })).sort((a, b) => b.year - a.year || plain(a.html).localeCompare(plain(b.html)))
  loading.value = false
}
watch(() => [props.otuId, props.taxonId], load, { immediate: true })

const shown = computed(() => (role.value === 'all' ? refs.value : refs.value.filter((r) => r.roles.has(role.value))))
const span = computed(() => {
  const ys = refs.value.map((r) => r.year).filter(Boolean)
  return ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : ''
})
</script>
