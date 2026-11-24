<template>
  <section
    v-if="today || recent.length"
    class="cow-home__sec cow-today"
  >
    <div
      v-if="today"
      class="cow-today__main"
    >
      <button
        type="button"
        class="cow-today__photo"
        title="Click to enlarge"
        @click="viewer = today"
      >
        <img
          :src="today.display"
          :alt="today.text"
        />
      </button>
      <div class="cow-today__text">
        <p class="cow-home__kicker">Species of the day</p>
        <RouterLink
          :to="{ name: 'otus-id-overview', params: { id: String(today.otuId) } }"
          class="cow-today__name"
          v-html="italic(today.text)"
        />
        <p class="cow-today__fam">{{ today.family }}</p>
        <p class="cow-today__note">A different species every day, picked from the {{ pool }} species with specimen photographs.</p>
        <RouterLink
          :to="{ name: 'otus-id-overview', params: { id: String(today.otuId) } }"
          class="cow-btn"
          >Open the species page</RouterLink
        >
      </div>
    </div>

    <div
      v-if="recent.length"
      class="cow-today__recent"
    >
      <p class="cow-home__kicker">Recently added</p>
      <div class="cow-today__strip">
        <RouterLink
          v-for="r in recent"
          :key="r.otuId"
          :to="{ name: 'otus-id-overview', params: { id: String(r.otuId) } }"
          class="cow-today__card"
        >
          <img
            :src="r.medium"
            :alt="r.text"
            loading="lazy"
          />
          <span v-html="italic(shortName(r.text))" />
        </RouterLink>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="viewer"
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
        <figure class="cow-viewer__fig">
          <img
            :src="viewer.display"
            :alt="viewer.text"
          />
          <figcaption>
            <span v-html="italic(viewer.text)" />
            <a
              :href="viewer.full"
              target="_blank"
              rel="noopener"
              >Full size ↗</a
            >
          </figcaption>
        </figure>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { loadDwc, italic } from '../../lib/dwc.js'
import { imagesOf } from '../../taxon-hero/heroImages.js'

const today = ref(null)
const recent = ref([])
const pool = ref(0)
const viewer = ref(null)
const shortName = (n) => String(n).split(' ').slice(0, 2).join(' ')

async function bestImage(otuId) {
  const ims = await imagesOf(otuId).catch(() => [])
  return ims.find((im) => im.view === 'Habitus') || ims.find((im) => im.rank < 40) || null
}

onMounted(async () => {
  let rows = []
  try {
    rows = await loadDwc()
  } catch {
    return
  }
  const withMedia = rows.filter((r) => r.basisOfRecord === 'PreservedSpecimen' && r.associatedMedia && r.otu_id && r.taxonRank === 'species')
  const byOtu = new Map()
  withMedia.forEach((r) => !byOtu.has(r.otu_id) && byOtu.set(r.otu_id, r))
  const list = [...byOtu.values()].sort((a, b) => a.otu_id - b.otu_id)
  pool.value = list.length
  if (!list.length) return

  // same species all day for everyone
  const day = Math.floor(Date.now() / 86400000)
  for (let k = 0; k < 6 && !today.value; k++) {
    const r = list[(day * 7 + k) % list.length]
    const im = await bestImage(r.otu_id)
    if (im) today.value = { ...im, otuId: r.otu_id, text: r.scientificName, family: r.family }
  }

  const newest = [...list].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 10)
  const found = await Promise.all(
    newest.map(async (r) => {
      const im = await bestImage(r.otu_id)
      return im ? { ...im, otuId: r.otu_id, text: r.scientificName } : null
    })
  )
  recent.value = found.filter(Boolean).slice(0, 6)
})
</script>
