<template>
  <div class="cow-k">
    <!-- which key? -->
    <section class="cow-k__picker">
      <p class="cow-home__kicker">Which key should I use?</p>
      <div class="cow-k__ask">
        <span>I want to identify</span>
        <select
          v-model="want"
          aria-label="What to identify"
        >
          <option value="">anything</option>
          <option value="genus">the genus</option>
          <option
            v-for="g in speciesGenera"
            :key="g"
            :value="g"
          >
            the species of {{ g }}
          </option>
        </select>
        <span>of a specimen from</span>
        <select
          v-model="region"
          aria-label="Region"
        >
          <option value="">anywhere</option>
          <option
            v-for="r in REGIONS.filter((x) => x !== 'World')"
            :key="r"
            :value="r"
          >
            {{ r }}
          </option>
        </select>
        <button
          v-if="want || region"
          type="button"
          class="cow-k__reset"
          @click="want = region = ''"
        >
          Reset
        </button>
      </div>
      <p
        v-if="want || region"
        class="cow-k__answer"
      >
        <template v-if="recommended.length">
          Best match: <b v-html="recommended[0].titleHtml" />.
          <template v-if="recommended.length > 1"> Also useful: {{ recommended.length - 1 }} more, marked below.</template>
        </template>
        <template v-else>No key covers that yet. Try “anywhere”, or the genus keys first.</template>
      </p>
    </section>

    <div class="cow-k__tools">
      <input
        v-model="query"
        type="search"
        placeholder="Search keys by taxon, author or region…"
        aria-label="Search keys"
      />
    </div>

    <p
      v-if="loading"
      class="cow-k__muted"
    >
      Loading keys…
    </p>
    <p
      v-else-if="errorMessage"
      class="cow-k__muted"
    >
      {{ errorMessage }}
    </p>

    <section
      v-for="grp in groups"
      :key="grp.title"
      class="cow-k__group"
    >
      <h2 class="cow-k__h2">{{ grp.title }} <span>{{ grp.items.length }}</span></h2>
      <div class="cow-k__grid">
        <article
          v-for="key in grp.items"
          :key="key.id"
          :class="['cow-k__card', { 'is-rec': recIds.has(key.id), 'is-dim': (want || region) && !recIds.has(key.id) }]"
        >
          <RouterLink
            :to="`/keys/${key.id}`"
            class="cow-k__fig"
            :aria-label="`Open ${key.title}`"
          >
            <img
              v-if="key.figure"
              :src="key.figure"
              alt=""
              loading="lazy"
            />
            <span
              v-else
              class="cow-k__nofig"
              >{{ key.coupletsCount || '' }}<small>couplets</small></span
            >
            <span
              v-if="recIds.has(key.id)"
              class="cow-k__rec"
              >{{ recommended[0]?.id === key.id ? 'Best match' : 'Recommended' }}</span
            >
          </RouterLink>
          <div class="cow-k__body">
            <div class="cow-k__tags">
              <span class="cow-k__tag is-region">{{ key.region }}</span>
              <span
                v-if="key.males"
                class="cow-k__tag"
                >Males</span
              >
              <span
                v-if="key.figure"
                class="cow-k__tag"
                >Illustrated</span
              >
              <span
                v-if="key.year"
                class="cow-k__tag is-year"
                >{{ key.year }}</span
              >
            </div>
            <RouterLink
              :to="`/keys/${key.id}`"
              class="cow-k__title"
              v-html="key.titleHtml"
            />
            <p class="cow-k__src">
              {{ key.sourceLabel }}
              <a
                v-if="key.doiUrl"
                :href="key.doiUrl"
                target="_blank"
                rel="noopener"
                >{{ key.doiDisplay }}</a
              >
            </p>
            <p
              v-if="key.description"
              class="cow-k__desc"
            >
              {{ open[key.id] || key.description.length < 150 ? key.description : `${key.description.slice(0, 140)}…` }}
              <button
                v-if="key.description.length >= 150"
                type="button"
                class="cow-k__more"
                @click="open[key.id] = !open[key.id]"
              >
                {{ open[key.id] ? 'less' : 'more' }}
              </button>
            </p>
            <p class="cow-k__nums">
              <span><b>{{ key.coupletsCount }}</b> couplets</span>
              <span><b>{{ key.taxaCount }}</b> taxa</span>
              <span v-if="key.figures"><b>{{ key.figures }}</b> figures</span>
            </p>
            <div class="cow-k__actions">
              <RouterLink
                :to="`/keys/${key.id}`"
                class="cow-btn"
                >Start the key →</RouterLink
              >
              <button
                type="button"
                @click="copyCite(key)"
              >
                {{ copied === key.id ? 'Copied ✓' : 'Cite' }}
              </button>
              <button
                type="button"
                @click="printKey(key)"
              >
                Print / PDF
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
    <p
      v-if="!loading && !groups.length"
      class="cow-k__muted"
    >
      No keys match “{{ query }}”.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { makeAPIRequest } from '@/utils/request'

const REGIONS = ['World', 'Palaearctic', 'Nearctic', 'Neotropical', 'Afrotropical', 'Madagascar', 'Oriental', 'Australasian', 'United Arab Emirates']
const SITE = 'Ceraphronoidea of the World'
const ORIGIN = 'https://shanetiltongc.github.io/Ceraphronoidea-of-the-World'

const loading = ref(true)
const keys = ref([])
const query = ref('')
const errorMessage = ref('')
const want = ref('')
const region = ref('')
const open = reactive({})
const copied = ref(null)

const strip = (v) => String(v || '').replace(/<[^>]*>/g, '')
const decode = (v) =>
  String(v || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function regionOf(text) {
  const t = text.toLowerCase()
  if (/of the world|world/.test(t)) return 'World'
  if (/palaearctic|palearctic/.test(t)) return 'Palaearctic'
  if (/nearctic/.test(t)) return 'Nearctic'
  if (/neotropic/.test(t)) return 'Neotropical'
  if (/malagasy|madagascar/.test(t)) return 'Madagascar'
  if (/afrotropic|africa/.test(t)) return 'Afrotropical'
  if (/arab emirates|uae/.test(t)) return 'United Arab Emirates'
  if (/oriental/.test(t)) return 'Oriental'
  if (/australasia|australia/.test(t)) return 'Australasian'
  return 'World'
}
// regions inside wider ones, for the picker
const INSIDE = { Madagascar: 'Afrotropical', 'United Arab Emirates': 'Palaearctic' }

function shortSource(plain) {
  const text = decode(plain).replace(/\s+/g, ' ').trim()
  const m = text.match(/^(.+?)\s*\((\d{4}[a-z]?)\)/)
  if (m) return { label: `${m[1].trim().replace(/\s*,\s*$/, '')}, ${m[2]}`, year: m[2] }
  return { label: text.length > 80 ? `${text.slice(0, 77)}…` : text, year: '' }
}
function doiOf(plain) {
  const m = String(plain || '').match(/(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)(\S+)/i)
  if (!m) return {}
  const doi = m[1].replace(/[.,;)\]]+$/, '')
  return { doiUrl: `https://doi.org/${doi}`, doiDisplay: `doi:${doi}` }
}
function publicDescription(value) {
  const text = decode(value).replace(/\s+/g, ' ').trim()
  if (!text || /to be attached|confirm on PDF|CC BY-NC|draft|TODO/i.test(text)) return ''
  return text
}
function italicize(title, scopeName) {
  const safe = esc(decode(title))
  const first = String(scopeName || '').trim().split(/\s+/)[0]
  if (!first) return safe
  return safe.replace(new RegExp(`\\b(${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`), '<i>$1</i>')
}

onMounted(async () => {
  try {
    const { data } = await makeAPIRequest.get('/leads', { params: { per: 1000 } })
    const leads = Array.isArray(data) ? data : []
    const full = await Promise.all(
      leads.map((l) =>
        makeAPIRequest
          .get(`/leads/key/${l.id}`)
          .then((r) => r.data || {})
          .catch(() => ({}))
      )
    )
    // scope names and ranks
    const otuIds = [...new Set(leads.map((l) => l.otu_id).filter(Boolean))]
    const scope = new Map()
    if (otuIds.length) {
      const { data: otus } = await makeAPIRequest.get('/otus', { params: { 'otu_id[]': otuIds, per: 500 } }).catch(() => ({ data: [] }))
      const tnIds = (otus || []).map((o) => o.taxon_name_id).filter(Boolean)
      const { data: names } = tnIds.length
        ? await makeAPIRequest.get('/taxon_names', { params: { 'taxon_name_id[]': tnIds, per: 500 } }).catch(() => ({ data: [] }))
        : { data: [] }
      const byTn = new Map((names || []).map((n) => [n.id, n]))
      ;(otus || []).forEach((o) => {
        const n = byTn.get(o.taxon_name_id) || {}
        scope.set(o.id, { name: n.cached || strip(o.object_tag), rank: String(n.rank_string || '').split('::').pop().toLowerCase() })
      })
    }

    keys.value = leads.map((lead, i) => {
      const meta = full[i].metadata || {}
      const tree = full[i].data || {}
      const sc = scope.get(lead.otu_id) || { name: meta.taxonomic_scope || '', rank: '' }
      const title = meta.title || lead.text || `Key ${lead.id}`
      const citation = strip(meta.origin_citation || '')
      const src = shortSource(citation)
      const allLeads = Object.values(tree.leads || {})
      const figs = allLeads.flatMap((x) => x.figures || [])
      const firstFig = (allLeads.find((x) => (x.figures || []).length)?.figures || [])[0]
      const text = `${title} ${lead.description || ''}`
      const isGenusKey = /^(superfamily|family|subfamily|tribe)$/.test(sc.rank) || /genera/i.test(title)
      return {
        id: lead.id,
        title: decode(title),
        titleHtml: italicize(title, sc.name),
        scopeName: sc.name,
        rank: sc.rank,
        level: isGenusKey ? 'genus' : 'species',
        genus: isGenusKey ? '' : String(sc.name).split(' ')[0],
        region: regionOf(text),
        males: /\bmales?\b/i.test(title) && !/females/i.test(title),
        citation: decode(citation),
        sourceLabel: src.label,
        year: src.year,
        ...doiOf(citation),
        description: publicDescription(lead.description),
        coupletsCount: lead.couplets_count || 0,
        taxaCount: lead.otus_count ? Math.max(0, lead.otus_count - (lead.otu_id ? 1 : 0)) : 0,
        figures: figs.length,
        figure: firstFig?.medium || '',
        tree
      }
    })
  } catch (err) {
    keys.value = []
    errorMessage.value = 'Could not load keys from TaxonWorks.'
  } finally {
    loading.value = false
  }
})

const speciesGenera = computed(() => [...new Set(keys.value.filter((k) => k.genus).map((k) => k.genus))].sort())

// keys that answer the picker, best first
const recommended = computed(() => {
  if (!want.value && !region.value) return []
  const regionScore = (k) => {
    if (!region.value) return 1
    if (k.region === region.value) return 3
    if (INSIDE[k.region] === region.value || INSIDE[region.value] === k.region) return 2
    if (k.region === 'World') return 1
    return 0
  }
  return keys.value
    .filter((k) => (!want.value || (want.value === 'genus' ? k.level === 'genus' : k.genus === want.value)) && regionScore(k) > 0)
    .sort((a, b) => regionScore(b) - regionScore(a) || b.coupletsCount - a.coupletsCount)
})
const recIds = computed(() => new Set(recommended.value.map((k) => k.id)))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return keys.value
  return keys.value.filter((k) => `${k.title} ${k.scopeName} ${k.sourceLabel} ${k.region} ${k.description}`.toLowerCase().includes(q))
})
const groups = computed(() => {
  const genusKeys = filtered.value.filter((k) => k.level === 'genus').sort((a, b) => b.coupletsCount - a.coupletsCount)
  const speciesKeys = filtered.value.filter((k) => k.level !== 'genus').sort((a, b) => a.genus.localeCompare(b.genus) || a.title.localeCompare(b.title))
  return [
    { title: 'Keys to genera', items: genusKeys },
    { title: 'Keys to species', items: speciesKeys }
  ].filter((g) => g.items.length)
})

async function copyCite(key) {
  const accessed = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const text = `${key.citation}\nInteractive key: ${key.title}. In: ${SITE}. Available from ${ORIGIN}/#/keys/${key.id} (accessed ${accessed}).`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key.id
    setTimeout(() => (copied.value = null), 2000)
  } catch {
    /* clipboard blocked */
  }
}

// a clean, printable version of the whole key (the browser's "Save as PDF")
function printKey(key) {
  const { entries = {}, leads = {} } = key.tree || {}
  const root = Object.keys(entries).find((id) => entries[id].parent_id === null)
  const couplets = []
  const walk = (id) => {
    const kids = (entries[id]?.children || []).map(String)
    if (kids.length) {
      couplets.push({ number: entries[kids[0]]?.couplet_number || '', leads: kids.map((k) => leads[k] || {}) })
      kids.forEach(walk)
    }
  }
  if (root) walk(root)
  couplets.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))
  const leadHtml = (l, i) => {
    const target = l.target_type === 'internal' ? `→ ${esc(l.target_label || '')}` : `<b>${l.target_label || ''}</b>`
    const figs = (l.figures || []).slice(0, 4).map((f) => `<img src="${f.medium}" alt="">`).join('')
    return `<div class="lead"><span class="n">${i === 0 ? '' : '–'}</span><span class="t">${l.text || ''}</span><span class="g">${target}</span>${figs ? `<div class="figs">${figs}</div>` : ''}</div>`
  }
  const body = couplets
    .map((c) => `<section class="c"><h3>${esc(c.number)}</h3>${c.leads.map(leadHtml).join('')}</section>`)
    .join('')
  const accessed = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(key.title)}</title>
<style>
body{font:11pt/1.45 Georgia,serif;color:#111;max-width:46rem;margin:2rem auto;padding:0 1rem}
h1{font-size:18pt;margin:0 0 .3rem}.cite{font-size:9.5pt;color:#444;border-left:3px solid #c88a2b;padding:.4rem .8rem;margin:.8rem 0 1.5rem;background:#faf7ef}
.c{display:grid;grid-template-columns:2.5rem 1fr;border-top:1px solid #ddd;padding:.5rem 0;break-inside:avoid}
.c h3{margin:0;font-size:11pt}.lead{grid-column:2;display:grid;grid-template-columns:1rem 1fr auto;gap:.4rem;margin:.15rem 0}
.g{white-space:nowrap;font-style:italic}.figs{grid-column:2/4;display:flex;gap:.4rem;flex-wrap:wrap;margin:.3rem 0}.figs img{max-height:110px;max-width:45%}
footer{margin-top:2rem;font-size:8.5pt;color:#666}
</style></head><body>
<h1>${key.titleHtml}</h1>
<div class="cite"><b>Cite the original key:</b> ${esc(key.citation)}<br><b>Online version:</b> ${esc(key.title)}. In: ${SITE}. ${ORIGIN}/#/keys/${key.id} (accessed ${accessed}).</div>
${body}
<footer>Printed from ${SITE} on ${accessed}. Couplet numbers follow the original publication.</footer>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>
</body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
}
</script>
