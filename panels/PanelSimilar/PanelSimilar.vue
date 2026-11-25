<template>
  <section
    v-if="sibs.length"
    class="cow-sim"
  >
    <div class="cow-sim__head">
      <p class="cow-sim__kicker">
        Other species of <i>{{ genus }}</i>
      </p>
      <span class="cow-sim__n">{{ total }} in the genus</span>
    </div>
    <div class="cow-sim__grid">
      <RouterLink
        v-for="s in sibs"
        :key="s.otu"
        :to="{ name: 'otus-id-overview', params: { id: String(s.otu) } }"
        class="cow-sim__card"
      >
        <span class="cow-sim__img">
          <img
            v-if="s.img"
            :src="s.img"
            alt=""
            loading="lazy"
          />
        </span>
        <span
          class="cow-sim__name"
          v-html="s.html"
        />
      </RouterLink>
    </div>
    <RouterLink
      v-if="genusOtu"
      :to="{ name: 'otus-id-overview', params: { id: String(genusOtu) } }"
      class="cow-sim__all"
    >
      All species of <i>{{ genus }}</i> →
    </RouterLink>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'
import { canonicalOf, rankOf, otuImages } from '../../lib/taxonPage.js'
import { loadDwc } from '../../lib/dwc.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxonId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})
const SHOW = 8
const sibs = ref([])
const total = ref(0)
const genus = ref('')
const genusOtu = ref(null)

function leaves(node, out = []) {
  for (const d of node?.descendants || []) {
    if ((d.descendants || []).length) leaves(d, out)
    else if (d.otu_id) out.push({ otu: d.otu_id, html: d.name })
  }
  return out
}

async function load() {
  sibs.value = []
  total.value = 0
  genusOtu.value = null
  if (!/species/.test(rankOf(props.taxon)) || !props.taxon?.parent_id) return
  genus.value = canonicalOf(props.taxon).split(' ')[0]
  try {
    const { data: otus } = await makeAPIRequest.get('/otus', { params: { 'taxon_name_id[]': props.taxon.parent_id, per: 5 } })
    const g = otus?.[0]?.id
    if (!g) return
    genusOtu.value = g
    const { data } = await makeAPIRequest.get(`/otus/${g}/inventory/taxonomy.json`)
    const all = leaves(data).filter((s) => String(s.otu) !== String(props.otuId))
    total.value = all.length + 1
    // pick siblings with a photo first: the specimen records say which species are imaged
    const imaged = new Set((await loadDwc()).filter((r) => r.associatedMedia && r.otu_id).map((r) => String(r.otu_id)))
    const cand = [...all.filter((x) => imaged.has(String(x.otu))), ...all.filter((x) => !imaged.has(String(x.otu)))]
    const withImg = []
    for (let i = 0; i < Math.min(cand.length, 36) && withImg.length < SHOW; i += 12) {
      const batch = cand.slice(i, i + 12)
      const imgs = await Promise.all(batch.map((x) => otuImages(x.otu)))
      batch.forEach((x, j) => {
        const best = imgs[j].find((im) => im.rank < 20)
        if (best && withImg.length < SHOW) withImg.push({ ...x, img: best.thumb })
      })
    }
    const rest = cand.filter((x) => !withImg.some((w) => w.otu === x.otu)).slice(0, Math.max(0, SHOW - withImg.length))
    sibs.value = [...withImg, ...rest]
  } catch {
    sibs.value = []
  }
}
watch(() => props.otuId, load, { immediate: true })
</script>
