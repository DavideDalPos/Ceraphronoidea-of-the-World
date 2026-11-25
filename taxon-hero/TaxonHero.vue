<template>
  <section
    v-if="taxon?.id"
    class="cow-hero"
  >
    <div
      v-if="images[0]"
      class="cow-hero__bg"
      :style="{ backgroundImage: `url(${images[0].medium})` }"
    />
    <div class="cow-hero__inner">
      <div class="cow-hero__text">
        <p class="cow-hero__rank">
          {{ taxon.rank || 'Combination' }}
          <span
            v-if="!taxon.is_valid"
            class="cow-hero__invalid"
            >not valid</span
          >
        </p>
        <h1
          class="cow-hero__name"
          v-html="taxon.full_name_tag"
        />
        <p
          v-if="taxon.descorator_status?.length"
          class="cow-hero__status"
        >
          {{ taxon.descorator_status.join('; ') }}
        </p>
        <ul class="cow-hero__facts">
          <li v-if="speciesCount">
            <b>{{ fmt(speciesCount) }}</b> valid species
          </li>
          <li v-if="hostCount">
            <RouterLink :to="{ name: 'otus-id-hosts', params: { id: String(otuId) } }">
              <b>{{ fmt(hostCount) }}</b> host {{ hostCount === 1 ? 'taxon' : 'taxa' }}
            </RouterLink>
          </li>
          <li v-if="images.length && !fromDescendants">
            <RouterLink :to="{ name: 'otus-id-images', params: { id: String(otuId) } }">
              <b>{{ images.length }}{{ images.length === 12 ? '+' : '' }}</b> images
            </RouterLink>
          </li>
          <li class="cow-hero__tools">
            <a
              :href="dwcUrl"
              target="_blank"
              rel="noopener"
              class="cow-hero__btn"
              title="Download Darwin Core occurrences (CSV)"
              >↓ DwC data</a
            >
            <a
              :href="apiUrl"
              target="_blank"
              rel="noopener"
              class="cow-hero__btn"
              title="This taxon in the TaxonWorks API (JSON)"
              >{ } JSON</a
            >
          </li>
        </ul>
      </div>

      <!-- one big photo, thumbnails beside it; click to open the viewer -->
      <div
        v-if="images.length"
        class="cow-hero__stage"
      >
        <button
          type="button"
          class="cow-hero__main"
          aria-label="Open image viewer"
          @click="open(index)"
        >
          <img
            :key="images[index].id"
            :src="images[index].display"
            :alt="images[index].caption || plainName"
          />
          <span
            v-if="images[index].taxon || images[index].caption || images[index].credit"
            class="cow-hero__main-cap"
          >
            <span
              v-if="images[index].taxon"
              v-html="images[index].taxon"
            />
            <template v-if="images[index].caption"> · {{ images[index].caption }}</template>
            <template v-if="images[index].credit"> · {{ images[index].credit }}</template>
          </span>
        </button>
        <div
          v-if="images.length > 1"
          class="cow-hero__thumbcol"
        >
          <button
            v-for="(im, i) in images"
            :key="im.id"
            type="button"
            :class="['cow-hero__tb', { 'is-on': i === index }]"
            :aria-label="`Show image ${i + 1}`"
            @click="index = i"
          >
            <img
              :src="im.thumb"
              alt=""
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- full-screen viewer -->
    <Teleport to="body">
      <div
        v-if="viewer !== null && images[viewer]"
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
          v-if="images.length > 1"
          type="button"
          class="cow-viewer__nav cow-viewer__nav--prev"
          aria-label="Previous image"
          @click="go(-1)"
        >
          ‹
        </button>
        <figure class="cow-viewer__fig">
          <img
            :key="images[viewer].id"
            :src="images[viewer].display"
            :alt="images[viewer].caption || plainName"
          />
          <figcaption>
            <RouterLink
              v-if="images[viewer].taxon && images[viewer].otuId"
              :to="{ name: 'otus-id-overview', params: { id: String(images[viewer].otuId) } }"
              v-html="images[viewer].taxon"
              @click="viewer = null"
            />
            <span v-if="images[viewer].caption">{{ images[viewer].caption }}</span>
            <span v-if="images[viewer].credit">{{ images[viewer].credit }}</span>
            <span>{{ viewer + 1 }} / {{ images.length }}</span>
            <a
              :href="images[viewer].full"
              target="_blank"
              rel="noopener"
              >Full size ↗</a
            >
          </figcaption>
        </figure>
        <button
          v-if="images.length > 1"
          type="button"
          class="cow-viewer__nav cow-viewer__nav--next"
          aria-label="Next image"
          @click="go(1)"
        >
          ›
        </button>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { heroImages } from './heroImages.js'
import { loadAssociations, matcher } from '../panels/PanelHosts/associations.js'

const props = defineProps({
  otu: { type: Object, default: () => ({}) },
  otuId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})

const { url: API, project_token: TOKEN } = __APP_ENV__
const dwcUrl = computed(() => `${API}/otus/${props.otuId}/inventory/dwc.csv?project_token=${TOKEN}`)
const apiUrl = computed(() => `${API}/otus/${props.otuId}/inventory/taxonomy.json?project_token=${TOKEN}`)
const images = ref([])
const index = ref(0)
const viewer = ref(null)
const ready = ref(false)
const fromDescendants = ref(false)
const speciesCount = ref(0)
const hostCount = ref(0)
let controller = null


const plainName = computed(() => String(props.taxon?.full_name_tag || '').replace(/<[^>]+>/g, ''))
const fmt = (n) => Number(n).toLocaleString()

const open = (i) => (viewer.value = i)
const go = (d) => (viewer.value = (viewer.value + d + images.value.length) % images.value.length)

function onKey(e) {
  if (viewer.value === null) return
  if (e.key === 'Escape') viewer.value = null
  if (images.value.length < 2) return
  if (e.key === 'ArrowLeft') go(-1)
  if (e.key === 'ArrowRight') go(1)
}
if (typeof window !== 'undefined') window.addEventListener('keydown', onKey)
onBeforeUnmount(() => {
  controller?.abort()
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey)
})

async function load() {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller
  images.value = []
  index.value = 0
  viewer.value = null
  ready.value = false
  speciesCount.value = 0
  hostCount.value = 0
  const otuId = props.otuId
  if (!otuId) return

  heroImages(otuId, signal)
    .then((r) => {
      images.value = r.images
      fromDescendants.value = r.fromDescendants
    })
    .catch(() => {})
    .finally(() => (ready.value = true))

  // valid species inside a genus or higher taxon
  if (!/species/i.test(props.taxon?.rank_string || '') && props.taxon?.id) {
    makeAPIRequest
      .get('/taxon_names', {
        signal,
        params: { 'taxon_name_id[]': props.taxon.id, descendants: true, nomenclature_group: 'Species', validity: true, per: 1 }
      })
      .then((r) => (speciesCount.value = Number(r.headers['pagination-total']) || 0))
      .catch(() => {})
  }

  loadAssociations()
    .then((all) => {
      const mine = matcher(otuId, props.taxon)
      const hosts = new Set(all.filter((r) => mine(r.s) && r.rel !== 'feeds on').map((r) => r.o.id || r.o.label))
      hostCount.value = hosts.size
    })
    .catch(() => {})
}

watch(() => [props.otuId, props.taxon?.id], load, { immediate: true })
</script>
