<template>
  <div class="cow-li">
    <p
      v-if="loading"
      class="cow-li__muted"
    >
      Loading the bibliography…
    </p>
    <template v-else>
      <!-- publications per year -->
      <section class="cow-li__chart-box">
        <div class="cow-li__chart-head">
          <p class="cow-home__kicker">Publications per year</p>
          <p class="cow-li__muted">
            {{ sources.length }} references, {{ firstYear }}–{{ lastYear }}<template v-if="decade"> · showing the {{ decade }}s</template>
          </p>
        </div>
        <div
          class="cow-li__chart"
          role="img"
          :aria-label="`Publications per year from ${firstYear} to ${lastYear}`"
        >
          <button
            v-for="y in years"
            :key="y.year"
            type="button"
            :class="['cow-li__bar', { 'is-on': !decade || Math.floor(y.year / 10) * 10 === decade }]"
            :style="{ height: `${y.n ? Math.max(4, (y.n / yearMax) * 100) : 0}%` }"
            :title="`${y.year}: ${y.n}`"
            @click="toggleDecade(Math.floor(y.year / 10) * 10)"
          />
        </div>
        <div class="cow-li__axis">
          <span
            v-for="d in decadeTicks"
            :key="d"
            :style="{ left: `${((d - firstYear) / (lastYear - firstYear + 1)) * 100}%` }"
            >{{ d }}</span
          >
        </div>
      </section>

      <div class="cow-li__tools">
        <input
          v-model="q"
          type="search"
          placeholder="Search author, title, journal or year…"
          aria-label="Search references"
        />
        <select
          v-model="decade"
          aria-label="Decade"
        >
          <option :value="0">All decades</option>
          <option
            v-for="d in decades"
            :key="d"
            :value="d"
          >
            {{ d }}s
          </option>
        </select>
        <label class="cow-at__check"><input
          v-model="withDoi"
          type="checkbox"
        /> With DOI</label>
        <button
          type="button"
          class="cow-ty__link"
          @click="downloadList"
        >
          Download CSV
        </button>
        <RouterLink
          to="/resources/tw/filter/bibliography"
          class="cow-ty__link"
          >Advanced search</RouterLink
        >
      </div>
      <p class="cow-li__muted">{{ shown.length }} references</p>

      <div
        v-for="g in groups"
        :key="g.year"
        class="cow-li__year"
      >
        <h3>{{ g.year }}</h3>
        <ul>
          <li
            v-for="s in g.items"
            :key="s.id"
          >
            <span v-html="s.html" />
            <a
              v-if="s.doi"
              :href="`https://doi.org/${s.doi}`"
              target="_blank"
              rel="noopener"
              class="cow-li__doi"
              >DOI ↗</a
            >
          </li>
        </ul>
      </div>
      <button
        v-if="shownGroups < allGroups.length"
        type="button"
        class="cow-ix__more"
        @click="shownGroups += 15"
      >
        Show more years
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { csv, download } from '../lib/dwc.js'

const loading = ref(true)
const sources = ref([])
const q = ref('')
const decade = ref(0)
const withDoi = ref(false)
const shownGroups = ref(15)

const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')

onMounted(async () => {
  try {
    const out = []
    for (let page = 1; page < 10; page++) {
      const { data } = await makeAPIRequest.get('/sources', { params: { in_project: true, per: 250, page } })
      const list = Array.isArray(data) ? data : []
      list.forEach((s) =>
        out.push({ id: s.id, year: Number(s.year) || null, html: s.cached || s.title || '', text: strip(s.cached || s.title), doi: s.doi || '' })
      )
      if (list.length < 250) break
    }
    sources.value = out
  } catch {
    sources.value = []
  } finally {
    loading.value = false
  }
})

const dated = computed(() => sources.value.filter((s) => s.year))
const firstYear = computed(() => Math.min(...dated.value.map((s) => s.year)))
const lastYear = computed(() => Math.max(...dated.value.map((s) => s.year)))
const years = computed(() => {
  if (!dated.value.length) return []
  const m = new Map()
  dated.value.forEach((s) => m.set(s.year, (m.get(s.year) || 0) + 1))
  const out = []
  for (let y = firstYear.value; y <= lastYear.value; y++) out.push({ year: y, n: m.get(y) || 0 })
  return out
})
const yearMax = computed(() => Math.max(1, ...years.value.map((y) => y.n)))
const decades = computed(() => [...new Set(dated.value.map((s) => Math.floor(s.year / 10) * 10))].sort((a, b) => b - a))
const decadeTicks = computed(() => decades.value.filter((d) => d % 20 === 0 && d >= firstYear.value).sort())
const toggleDecade = (d) => (decade.value = decade.value === d ? 0 : d)

const shown = computed(() => {
  const term = q.value.trim().toLowerCase()
  return sources.value.filter(
    (s) =>
      (!decade.value || (s.year && Math.floor(s.year / 10) * 10 === decade.value)) &&
      (!withDoi.value || s.doi) &&
      (!term || `${s.text} ${s.year}`.toLowerCase().includes(term))
  )
})
const allGroups = computed(() => {
  const m = new Map()
  shown.value.forEach((s) => {
    const k = s.year || 'Year unknown'
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(s)
  })
  return [...m]
    .sort((a, b) => (Number(b[0]) || 0) - (Number(a[0]) || 0))
    .map(([year, items]) => ({ year, items: items.sort((a, b) => a.text.localeCompare(b.text)) }))
})
const groups = computed(() => allGroups.value.slice(0, shownGroups.value))
watch([q, decade, withDoi], () => (shownGroups.value = 15))

function downloadList() {
  download(
    csv(shown.value, [
      ['Year', (s) => s.year],
      ['Reference', (s) => s.text],
      ['DOI', (s) => s.doi]
    ]),
    'ceraphronoidea-literature.csv'
  )
}
</script>
