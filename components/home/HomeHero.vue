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
    <div class="cow-hh__band">
      <dl class="cow-hh__stats">
        <div
          v-for="s in stats"
          :key="s.label"
          class="cow-hh__stat"
        >
          <dd>{{ s.value === null ? '…' : fmt(s.shown) }}</dd>
          <dt>{{ s.label }}</dt>
          <span class="cow-hh__note">{{ s.note }}</span>
        </div>
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
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
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
  { label: 'Valid species', note: 'in 3 families', value: null, shown: 0 },
  { label: 'Valid genera', note: 'living and fossil', value: null, shown: 0 },
  { label: 'Host records', note: 'who attacks whom', value: null, shown: 0 },
  { label: 'Images', note: 'slides and habitus', value: null, shown: 0 },
  { label: 'References', note: 'since 1807', value: null, shown: 0 },
  { label: 'Specimens', note: 'in Darwin Core', value: null, shown: 0 }
])
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
