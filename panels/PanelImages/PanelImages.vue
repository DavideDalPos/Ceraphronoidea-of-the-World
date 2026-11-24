<template>
  <section class="cow-im">
    <header class="cow-im__head">
      <div>
        <h2 class="cow-im__title">Images <span v-if="images.length">{{ images.length }}</span></h2>
        <p
          v-if="fromSpecies"
          class="cow-im__muted"
        >
          Photos of {{ speciesShown }} species in this {{ rankWord }}.
        </p>
      </div>
      <div
        v-if="views.length > 1"
        class="cow-im__filters"
        role="group"
        aria-label="Filter by view"
      >
        <button
          v-for="v in ['All', ...views]"
          :key="v"
          type="button"
          :class="{ 'is-on': view === v }"
          @click="view = v"
        >
          {{ v }}
        </button>
      </div>
    </header>

    <p
      v-if="loading"
      class="cow-im__muted"
    >
      Loading images…
    </p>
    <p
      v-else-if="!images.length"
      class="cow-im__empty"
    >
      No images yet for this taxon.
    </p>

    <div
      v-else
      class="cow-im__grid"
    >
      <button
        v-for="(im, i) in shown"
        :key="im.id"
        type="button"
        class="cow-im__tile"
        :aria-label="`Open image ${i + 1}`"
        @click="viewer = i"
      >
        <img
          :src="im.medium"
          :alt="im.caption || im.taxonText || ''"
          loading="lazy"
        />
        <span class="cow-im__tag">{{ im.view }}</span>
        <span
          v-if="im.taxon"
          class="cow-im__cap"
          v-html="im.taxon"
        />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="viewer !== null && shown[viewer]"
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
          v-if="shown.length > 1"
          type="button"
          class="cow-viewer__nav cow-viewer__nav--prev"
          aria-label="Previous image"
          @click="go(-1)"
        >
          ‹
        </button>
        <figure class="cow-viewer__fig">
          <img
            :key="shown[viewer].id"
            :src="shown[viewer].display"
            :alt="shown[viewer].caption || ''"
          />
          <figcaption>
            <RouterLink
              v-if="shown[viewer].otuId"
              :to="{ name: 'otus-id-overview', params: { id: String(shown[viewer].otuId) } }"
              v-html="shown[viewer].taxon"
              @click="viewer = null"
            />
            <span>{{ shown[viewer].view }}</span>
            <span v-if="shown[viewer].caption">{{ shown[viewer].caption }}</span>
            <span v-if="specimen(shown[viewer])">Specimen {{ specimen(shown[viewer]) }}</span>
            <span v-if="shown[viewer].credit">{{ shown[viewer].credit }}</span>
            <span>{{ viewer + 1 }} / {{ shown.length }}</span>
            <a
              :href="shown[viewer].full"
              target="_blank"
              rel="noopener"
              >Full size ↗</a
            >
          </figcaption>
        </figure>
        <button
          v-if="shown.length > 1"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { imagesOf, leaves } from '../../taxon-hero/heroImages.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})

const ORDER = ['Habitus', 'Head', 'Wings', 'Details', 'Other', 'Labels']
const loading = ref(true)
const images = ref([])
const fromSpecies = ref(false)
const speciesShown = ref(0)
const view = ref('All')
const viewer = ref(null)
const rankWord = computed(() => String(props.taxon?.rank || 'taxon').toLowerCase())

async function load() {
  loading.value = true
  images.value = []
  view.value = 'All'
  viewer.value = null
  fromSpecies.value = false
  if (!props.otuId) return
  try {
    let list = await imagesOf(props.otuId)
    if (!list.length) {
      // genus and higher: show the photos of the species inside it
      const { data } = await makeAPIRequest.get(`/otus/${props.otuId}/inventory/taxonomy.json`)
      const ls = leaves(data).slice(0, 40)
      const per = await Promise.all(
        ls.map((sp) =>
          imagesOf(sp.id)
            .then((ims) => ims.map((im) => ({ ...im, taxon: sp.name, otuId: sp.id })))
            .catch(() => [])
        )
      )
      list = per.flat()
      fromSpecies.value = list.length > 0
      speciesShown.value = per.filter((p) => p.length).length
    }
    images.value = list
  } catch {
    images.value = []
  } finally {
    loading.value = false
  }
}
watch(() => props.otuId, load, { immediate: true })

const views = computed(() => ORDER.filter((v) => images.value.some((im) => im.view === v)))
const shown = computed(() =>
  images.value
    .filter((im) => view.value === 'All' || im.view === view.value)
    .sort((a, b) => ORDER.indexOf(a.view) - ORDER.indexOf(b.view))
)
const go = (d) => (viewer.value = (viewer.value + d + shown.value.length) % shown.value.length)
// "CollectionObject 2810075; …, NHRS-HEVA_6792, …" → the catalogue number
const specimen = (im) => {
  const m = String(im.depiction || '').match(/;\s*[0-9a-f-]{36},\s*([^,:]+)/i)
  return m ? m[1].trim() : ''
}

function onKey(e) {
  if (viewer.value === null) return
  if (e.key === 'Escape') viewer.value = null
  if (e.key === 'ArrowRight') go(1)
  if (e.key === 'ArrowLeft') go(-1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
