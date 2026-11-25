<template>
  <section class="cow-hh">
    <div class="cow-hh__inner">
      <div class="cow-hh__text">
        <p class="cow-hh__kicker">Hymenoptera · Superfamily</p>
        <h1 class="cow-hh__title">Ceraphronoidea<span>of the World</span></h1>
        <p class="cow-hh__lead">
          Tiny wasps, mostly a millimetre or two long, that parasitise gall midges, aphid parasitoids, scale insects and
          more. Every name, image, host and specimen, cited.
        </p>
        <div class="cow-hh__search">
          <AutocompleteOtu class="w-full" />
        </div>
      </div>

      <!-- eyepiece -->
      <div class="cow-hh__scope">
        <button
          type="button"
          class="cow-hh__ring"
          aria-label="Enlarge this photo"
          title="Click to enlarge"
          @click="openViewer"
        >
          <img
            v-for="(p, i) in PHOTOS"
            :key="p.src"
            :src="asset(p.src)"
            :alt="p.name"
            :class="['cow-hh__img', { 'is-on': i === current }]"
            :style="{ objectPosition: p.pos || 'center' }"
          />
          <span
            class="cow-hh__reticle"
            aria-hidden="true"
          />
          <span class="cow-hh__zoom">⤢ Enlarge</span>
        </button>
        <div class="cow-hh__label">
          <p class="cow-hh__label-name">
            <i>{{ PHOTOS[current].name }}</i> {{ PHOTOS[current].author }}
          </p>
          <p class="cow-hh__label-meta">{{ PHOTOS[current].family }} · photo István Mikó</p>
        </div>
        <div
          class="cow-hh__dots"
          role="tablist"
          aria-label="Specimen photos"
        >
          <button
            v-for="(p, i) in PHOTOS"
            :key="p.src"
            type="button"
            role="tab"
            :aria-selected="i === current"
            :aria-label="p.name"
            :class="{ 'is-on': i === current }"
            @click="show(i)"
          />
        </div>
      </div>
    </div>

    <!-- numbers band -->
    <div
      ref="bandEl"
      :class="['cow-hh__band', { 'is-run': stats.some((x) => x.go) }]"
    >
      <dl class="cow-hh__stats">
        <component
          :is="s.to ? 'RouterLink' : 'div'"
          v-for="(s, i) in stats"
          :key="s.label"
          :to="s.to"
          :class="['cow-hh__stat', { 'is-go': s.go, 'is-link': s.to }]"
          :style="{ '--i': i }"
        >
          <svg
            class="cow-hh__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          ><path :d="ICONS[i]" /></svg>
          <dd :aria-label="s.value === null ? 'loading' : fmt(s.value)">
            <span
              v-if="s.value === null"
              class="cow-hh__wait"
            >…</span>
            <span
              v-else
              class="cow-odo"
              aria-hidden="true"
            >
              <template
                v-for="(ch, k) in fmt(s.value).split('')"
                :key="k"
              >
                <span
                  v-if="/\d/.test(ch)"
                  class="cow-odo__col"
                >
                  <span
                    class="cow-odo__strip"
                    :style="{ transform: s.go ? `translateY(-${(10 + Number(ch)) * 10 / 2}%)` : 'translateY(0)', transitionDelay: `${s.delay + k * 60}ms` }"
                  >
                    <span
                      v-for="n in 20"
                      :key="n"
                    >{{ (n - 1) % 10 }}</span>
                  </span>
                </span>
                <span
                  v-else
                  class="cow-odo__sep"
                >{{ ch }}</span>
              </template>
            </span>
          </dd>
          <dt>{{ s.label }}</dt>
          <span class="cow-hh__note">{{ s.note }}</span>
        </component>
      </dl>
    </div>

    <!-- enlarged photo -->
    <Teleport to="body">
      <div
        v-if="viewer !== null"
        class="cow-viewer"
        role="dialog"
        aria-modal="true"
        @click.self="viewer = null"
      >
        <button
          type="button"
          class="cow-viewer__close"
          aria-label="Close"
          @click="viewer = null"
        >
          ×
        </button>
        <button
          type="button"
          class="cow-viewer__nav cow-viewer__nav--prev"
          aria-label="Previous photo"
          @click="viewer = (viewer + PHOTOS.length - 1) % PHOTOS.length"
        >
          ‹
        </button>
        <figure class="cow-viewer__fig">
          <img
            :src="asset(PHOTOS[viewer].src)"
            :alt="PHOTOS[viewer].name"
          />
          <figcaption>
            <span><i>{{ PHOTOS[viewer].name }}</i> {{ PHOTOS[viewer].author }}</span>
            <span>{{ PHOTOS[viewer].family }}</span>
            <span>Photo: István Mikó</span>
            <span>{{ viewer + 1 }} / {{ PHOTOS.length }}</span>
          </figcaption>
        </figure>
        <button
          type="button"
          class="cow-viewer__nav cow-viewer__nav--next"
          aria-label="Next photo"
          @click="viewer = (viewer + 1) % PHOTOS.length"
        >
          ›
        </button>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { resolveAssetUrl } from '@/utils/url'
import AutocompleteOtu from '../AutocompleteOtu.global.vue'
import { loadAssociations, isCeraphronoid } from '../../panels/PanelHosts/associations.js'

const { base_url } = __APP_ENV__
const asset = (p) => resolveAssetUrl(p, base_url)

const PHOTOS = [
  { src: '/images/donadiola-francescae-slide.jpg', name: 'Donadiola francescae', author: 'Dessart, 1975', family: 'Ceraphronidae', pos: '35% 62%' },
  { src: '/images/ceraphron-aguinaldoi-hero.jpg', name: 'Ceraphron aguinaldoi', author: '', family: 'Ceraphronidae', pos: '45% 75%' },
  { src: '/images/conostigmus-tubifer-point.jpg', name: 'Conostigmus tubifer', author: '', family: 'Megaspilidae', pos: '55% 40%' },
  { src: '/images/about-crassicornis-strip.jpg', name: 'Ceraphron crassicornis', author: 'Harrington, 1899', family: 'Ceraphronidae', pos: '40% 50%' }
]

const current = ref(0)
const viewer = ref(null)
function openViewer() {
  viewer.value = current.value
  clearInterval(timer)
}
function onKey(e) {
  if (viewer.value === null) return
  if (e.key === 'Escape') viewer.value = null
  if (e.key === 'ArrowRight') viewer.value = (viewer.value + 1) % PHOTOS.length
  if (e.key === 'ArrowLeft') viewer.value = (viewer.value + PHOTOS.length - 1) % PHOTOS.length
}
let timer = null
const next = () => (current.value = (current.value + 1) % PHOTOS.length)
function show(i) {
  current.value = i
  clearInterval(timer)
  timer = setInterval(next, 7000)
}

const stats = reactive([
  { label: 'Valid species', note: 'in 3 families', value: null, shown: 0, go: false, delay: 0, to: null },
  { label: 'Valid genera', note: 'living and fossil', value: null, shown: 0, go: false, delay: 0, to: null },
  { label: 'Host records', note: 'who attacks whom', value: null, shown: 0, go: false, delay: 0, to: '/interactions' },
  { label: 'Images', note: 'slides and habitus', value: null, shown: 0, go: false, delay: 0, to: '/types' },
  { label: 'References', note: 'since 1807', value: null, shown: 0, go: false, delay: 0, to: '/literature' },
  { label: 'Specimens', note: 'in Darwin Core', value: null, shown: 0, go: false, delay: 0, to: '/specimens' }
])
// small line icons, drawn when the band comes into view
const ICONS = [
  'M12 3.2a1.5 1.5 0 1 0 .01 0M12 6.6c-1.3 0-2.1 1-2.1 2.2s.8 2.2 2.1 2.2 2.1-1 2.1-2.2-.8-2.2-2.1-2.2zM12 11.6c-1.7 0-2.6 1.5-2.6 3.5s.9 4.2 2.6 4.2 2.6-2.2 2.6-4.2-.9-3.5-2.6-3.5zM10 8.2 3.5 5.6M14 8.2l6.5-2.6M10.1 9.8 4.8 11.4M13.9 9.8l5.3 1.6',
  'M12 21V9M12 13 6.5 8.5M12 13l5.5-4.5M6.5 8.5V4.5M17.5 8.5V4.5M12 9V3.5',
  'M6 12m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0M18 5.5m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0M18 18.5m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0M8 11l8-4.4M8 13l8 4.4',
  'M3.5 8h3.5l2-2.5h6l2 2.5h3.5v11.5h-17zM12 16.8m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0',
  'M4.5 5h6a2 2 0 0 1 1.5.7V20a2.3 2.3 0 0 0-1.5-.6h-6zM19.5 5h-6a2 2 0 0 0-1.5.7V20a2.3 2.3 0 0 1 1.5-.6h6z',
  'M12 2.5v13M8.5 15.5h7v5.5h-7zM9.5 6.5h5M10 18.2h4'
]
// run the animation when the band is on screen
const bandEl = ref(null)
const inView = ref(false)
let io = null
onMounted(() => {
  if (!('IntersectionObserver' in window)) return (inView.value = true)
  io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && ((inView.value = true), io.disconnect())),
    { threshold: 0.35 }
  )
  if (bandEl.value) io.observe(bandEl.value)
})
onBeforeUnmount(() => io?.disconnect())
// all numbers roll together once every value has arrived (or after 2.5 s,
// then any late one rolls as soon as it comes) and the band is visible
let waited = false
let waitTimer = null
function startRolls() {
  stats.forEach((s, i) => {
    if (s.value === null || s.go) return
    s.delay = waited ? 0 : i * 140
    setTimeout(() => (s.go = true), 40)
  })
}
watch(
  () => [inView.value, ...stats.map((s) => s.value)],
  () => {
    if (!inView.value) return
    const all = stats.every((s) => s.value !== null)
    if (all || waited) {
      clearTimeout(waitTimer)
      startRolls()
      waited = true
    } else if (!waitTimer) {
      waitTimer = setTimeout(() => {
        waited = true
        startRolls()
      }, 2500)
    }
  },
  { immediate: true }
)
const fmt = (n) => Number(n).toLocaleString()

// count up once, quickly
function countUp(s, value) {
  s.value = value
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return (s.shown = value)
  const t0 = performance.now()
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 1200)
    s.shown = Math.round(value * (1 - Math.pow(1 - k, 3)))
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const SUPERFAMILY = 1541972
const total = (r) => Number(r.headers['pagination-total']) || 0
const names = (group) =>
  makeAPIRequest
    .get('/taxon_names', { params: { 'taxon_name_id[]': SUPERFAMILY, descendants: true, nomenclature_group: group, validity: true, per: 1 } })
    .then(total)

onMounted(() => {
  window.addEventListener('keydown', onKey)
  timer = setInterval(next, 7000)
  names('Species').then((v) => countUp(stats[0], v)).catch(() => {})
  makeAPIRequest
    .get('/taxon_names', { params: { 'taxon_name_id[]': SUPERFAMILY, descendants: true, nomenclature_group: 'Genus', validity: true, per: 500 } })
    .then((r) => countUp(stats[1], (r.data || []).filter((t) => /::genus$/i.test(t.rank_string || '')).length))
    .catch(() => {})
  loadAssociations()
    .then((rows) => countUp(stats[2], rows.filter((r) => isCeraphronoid(r.s)).length))
    .catch(() => {})
  makeAPIRequest
    .get('/stats')
    .then((r) => {
      const d = r.data?.data || {}
      countUp(stats[3], d.Images || 0)
      countUp(stats[4], d['Project sources'] || 0)
      countUp(stats[5], d['Collection objects'] || d['Dwc occurrences'] || 0)
    })
    .catch(() => {})
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})
</script>
