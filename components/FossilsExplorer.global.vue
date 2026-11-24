<template>
  <div class="cow-fo">
    <!-- Stigmaphronidae -->
    <section class="cow-fo__sec">
      <p class="cow-home__kicker">Extinct family</p>
      <h2 class="cow-fo__h2">Stigmaphronidae Kozlov, 1975</h2>
      <p class="cow-fo__lead">
        Known only from Cretaceous fossils. {{ stigma.species }} species in {{ stigma.genera.length }} genera are
        recorded here.
        <RouterLink :to="{ name: 'otus-id-overview', params: { id: String(STIGMA_OTU) } }">Open the family page →</RouterLink>
      </p>
      <p
        v-if="loading"
        class="cow-fo__muted"
      >
        Loading…
      </p>
      <div class="cow-fo__genera">
        <article
          v-for="g in stigma.genera"
          :key="g.id"
          class="cow-fo__gcard"
        >
          <RouterLink
            :to="{ name: 'otus-id-overview', params: { id: String(g.id) } }"
            class="cow-fo__gname"
            v-html="g.html"
          />
          <ul>
            <li
              v-for="s in g.species"
              :key="s.id"
            >
              <RouterLink
                :to="{ name: 'otus-id-overview', params: { id: String(s.id) } }"
                v-html="s.html"
              />
            </li>
          </ul>
          <p
            v-if="!g.species.length"
            class="cow-fo__muted"
          >
            No species listed
          </p>
        </article>
      </div>
    </section>

    <!-- every fossil species in the superfamily -->
    <section class="cow-fo__sec">
      <p class="cow-home__kicker">Across the superfamily</p>
      <h2 class="cow-fo__h2">All fossil species <span v-if="fossils.length">{{ fossils.length }}</span></h2>
      <p class="cow-fo__lead">Species classified as fossil in TaxonWorks, in all three families.</p>
      <ul class="cow-fo__list">
        <li
          v-for="f in fossils"
          :key="f.id"
        >
          <RouterLink
            v-if="f.otu"
            :to="{ name: 'otus-id-overview', params: { id: String(f.otu) } }"
            v-html="f.html"
          />
          <span
            v-else
            v-html="f.html"
          />
          <span
            v-if="!f.valid"
            class="cow-fo__tag"
            >not valid</span
          >
        </li>
      </ul>
    </section>

    <!-- literature on the family -->
    <section
      v-if="refs.length"
      class="cow-fo__sec"
    >
      <p class="cow-home__kicker">Literature</p>
      <h2 class="cow-fo__h2">References on Stigmaphronidae</h2>
      <ol class="cow-nm__refs">
        <li
          v-for="r in refs"
          :key="r.id"
        >
          <span class="cow-nm__ryear">{{ r.year }}</span>
          <span v-html="r.html" />
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { makeAPIRequest } from '@/utils/request'

const STIGMA_OTU = 1373001
const STIGMA_TN = 1542779
const SUPERFAMILY = 1541972

const loading = ref(true)
const stigma = reactive({ species: 0, genera: [] })
const fossils = ref([])
const refs = ref([])
const strip = (h) => String(h || '').replace(/<[^>]+>/g, '')

function speciesUnder(node, out = []) {
  for (const d of node?.descendants || []) {
    if (!(d.descendants || []).length) out.push({ id: d.otu_id, html: d.name })
    else speciesUnder(d, out)
  }
  return out
}

onMounted(async () => {
  try {
    const { data } = await makeAPIRequest.get(`/otus/${STIGMA_OTU}/inventory/taxonomy.json`)
    stigma.genera = (data.descendants || []).map((g) => ({ id: g.otu_id, html: g.name, species: speciesUnder(g) }))
    stigma.species = stigma.genera.reduce((n, g) => n + g.species.length, 0)
  } catch {
    /* none */
  }
  loading.value = false

  try {
    const { data } = await makeAPIRequest.get('/taxon_names', {
      params: {
        'taxon_name_id[]': SUPERFAMILY,
        descendants: true,
        nomenclature_group: 'Species',
        'taxon_name_classification[]': 'TaxonNameClassification::Iczn::Fossil',
        per: 500
      }
    })
    const names = (data || []).map((t) => ({ id: t.id, html: t.cached_html || `<i>${t.cached}</i> ${t.cached_author_year || ''}`, text: t.cached, valid: t.cached_is_valid !== false }))
    const otus = new Map()
    for (let i = 0; i < names.length; i += 80) {
      const { data: o } = await makeAPIRequest.get('/otus', { params: { 'taxon_name_id[]': names.slice(i, i + 80).map((n) => n.id), per: 500 } })
      ;(o || []).forEach((x) => !otus.has(x.taxon_name_id) && otus.set(x.taxon_name_id, x.id))
    }
    fossils.value = names.map((n) => ({ ...n, otu: otus.get(n.id) })).sort((a, b) => a.text.localeCompare(b.text))
  } catch {
    fossils.value = []
  }

  try {
    const { data } = await makeAPIRequest.get(`/taxon_names/${STIGMA_TN}/inventory/catalog`)
    refs.value = (data.sources || [])
      .map((s) => ({ id: s.id, html: s.cached, year: (strip(s.cached).match(/\((\d{4})/) || [])[1] || '' }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)))
  } catch {
    refs.value = []
  }
})
</script>
