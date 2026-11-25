<template>
  <section class="cow-pp">
    <p
      v-if="loading"
      class="cow-pp__empty"
    >
      Loading specimen records…
    </p>
    <div
      v-else-if="!rows.length"
      class="cow-pp__empty"
    >
      <p>No specimen records for this taxon yet.</p>
      <RouterLink to="/specimens">
        Browse all specimen records →
      </RouterLink>
    </div>
    <template v-else>
      <div class="cow-pp__head">
        <p class="cow-pp__nums">
          <b>{{ rows.length }}</b> specimen record{{ rows.length === 1 ? '' : 's' }}
          <template v-if="types">
            · <b>{{ types }}</b> type{{ types === 1 ? '' : 's' }}
          </template>
          · in <b>{{ repos }}</b> collection{{ repos === 1 ? '' : 's' }}
        </p>
        <RouterLink
          to="/specimens"
          class="cow-pp__all"
        >
          All specimen records →
        </RouterLink>
      </div>
      <div class="cow-pp__grid">
        <article
          v-for="r in sorted"
          :key="r.key"
          class="cow-pp__card"
        >
          <button
            type="button"
            class="cow-pp__img"
            :disabled="!imagesOf(r).length"
            @click="open(r)"
          >
            <img
              v-if="imagesOf(r)[0]"
              :src="imagesOf(r)[0].card"
              alt=""
              loading="lazy"
            />
            <span v-else>{{ r.associatedMedia ? '…' : 'No image' }}</span>
            <small v-if="imagesOf(r).length > 1">{{ imagesOf(r).length }} images</small>
          </button>
          <div class="cow-pp__body">
            <p class="cow-pp__top">
              <span
                v-if="r.typeStatus"
                :class="['cow-ty2__kind', `is-${String(r.typeStatus).toLowerCase()}`]"
              >{{ r.typeStatus }}</span>
              <span
                v-if="!isSpecies"
                class="cow-pp__name"
                v-html="nameHtml(r)"
              />
            </p>
            <p class="cow-pp__repo">
              <b>{{ r.institutionCode || '—' }}</b> {{ repoName(r.institutionCode) }}
            </p>
            <p class="cow-pp__cat">
              {{ String(r.catalogNumber || 'no number').replace(/^https?:\/\//, '') }}
            </p>
            <p
              v-if="place(r)"
              class="cow-pp__where"
            >
              {{ place(r) }}
            </p>
            <p
              v-if="r.recordedBy || r.year"
              class="cow-pp__where"
            >
              {{ [r.recordedBy, r.year].filter(Boolean).join(', ') }}
            </p>
          </div>
        </article>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="viewer"
        class="cow-ty2__viewer"
        @click.self="viewer = null"
      >
        <div class="cow-ty2__vbox">
          <button
            type="button"
            class="cow-ty2__vclose"
            aria-label="Close"
            @click="viewer = null"
          >
            ×
          </button>
          <p
            class="cow-ty2__vtitle"
            v-html="nameHtml(viewer.r)"
          />
          <div class="cow-ty2__vstage">
            <button
              v-if="viewer.images.length > 1"
              type="button"
              class="cow-ty2__vnav"
              @click="viewer.i = (viewer.i + viewer.images.length - 1) % viewer.images.length"
            >
              ‹
            </button>
            <img
              :src="viewer.images[viewer.i].big"
              alt=""
            />
            <button
              v-if="viewer.images.length > 1"
              type="button"
              class="cow-ty2__vnav"
              @click="viewer.i = (viewer.i + 1) % viewer.images.length"
            >
              ›
            </button>
          </div>
          <p class="cow-ty2__vcap">
            <template v-if="viewer.images[viewer.i].view">
              {{ viewer.images[viewer.i].view }} ·
            </template>
            {{ viewer.i + 1 }} / {{ viewer.images.length }} ·
            <a
              :href="viewer.images[viewer.i].full"
              target="_blank"
              rel="noopener"
            >Full size</a>
          </p>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { loadDwc } from '../../lib/dwc.js'
import { rankOf, inScope, otuImages } from '../../lib/taxonPage.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxonId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})
const REPOS = {
  USNM: 'Smithsonian, Washington DC',
  NHRS: 'Swedish Museum of Natural History',
  PSUC_FEM: 'Frost Entomological Museum, Penn State',
  HNHM: 'Hungarian Natural History Museum',
  MNHN: 'Muséum national d’Histoire naturelle, Paris',
  NHMUK: 'Natural History Museum, London',
  CNC: 'Canadian National Collection, Ottawa',
  MZHF: 'Finnish Museum of Natural History'
}
const repoName = (c) => REPOS[c] || ''
const TYPE_RANK = { holotype: 0, neotype: 1, lectotype: 2, syntype: 3, paralectotype: 4, paratype: 5 }
const CER = ['Ceraphronidae', 'Megaspilidae', 'Stigmaphronidae']
const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const nameHtml = (r) => {
  const a = r.scientificNameAuthorship
  const n = String(r.scientificName || '')
  return `<i>${esc((a ? n.replace(a, '') : n).trim())}</i>${a ? ` ${esc(a)}` : ''}`
}
const place = (r) => [r.country, r.stateProvince, r.verbatimLocality].filter(Boolean).join(', ').slice(0, 140)

const loading = ref(true)
const rows = ref([])
const imgs = reactive({})
const isSpecies = computed(() => /species/.test(rankOf(props.taxon)))

async function load() {
  loading.value = true
  try {
    const all = await loadDwc()
    rows.value = all
      .map((r, i) => ({ ...r, key: i }))
      .filter((r) => r.basisOfRecord === 'PreservedSpecimen' && CER.includes(r.family))
      .filter(inScope(props.otuId, props.taxon))
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
  // images, a few species at a time
  const otus = [...new Set(rows.value.filter((r) => r.associatedMedia).map((r) => r.otu_id))]
  const worker = async () => {
    while (otus.length) {
      const o = otus.shift()
      imgs[o] = await otuImages(o)
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker))
}
watch(() => props.otuId, load, { immediate: true })

const sorted = computed(() =>
  [...rows.value].sort(
    (a, b) =>
      (a.typeStatus ? TYPE_RANK[String(a.typeStatus).toLowerCase()] ?? 6 : 9) - (b.typeStatus ? TYPE_RANK[String(b.typeStatus).toLowerCase()] ?? 6 : 9) ||
      String(a.scientificName).localeCompare(String(b.scientificName)) ||
      String(a.catalogNumber).localeCompare(String(b.catalogNumber), undefined, { numeric: true })
  )
)
const types = computed(() => rows.value.filter((r) => r.typeStatus).length)
const repos = computed(() => new Set(rows.value.map((r) => r.institutionCode).filter(Boolean)).size)
// this specimen's photos: those whose depiction names its catalogue number
function imagesOf(r) {
  const all = imgs[r.otu_id] || []
  const cat = String(r.catalogNumber || '')
  const mine = cat ? all.filter((x) => x.label.includes(cat)) : []
  return r.associatedMedia ? (mine.length ? mine : []) : []
}

const viewer = ref(null)
function open(r) {
  const images = imagesOf(r)
  if (images.length) viewer.value = { r, i: 0, images }
}
</script>
