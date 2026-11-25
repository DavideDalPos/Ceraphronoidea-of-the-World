// Shared helpers for the taxon-page panels (Overview, Specimens, Literature).
import { makeAPIRequest } from '@/utils/request'
import { matcher } from '../panels/PanelHosts/associations.js'

const { url: API, project_token: TOKEN } = __APP_ENV__

// "Dendrocerus carpenteri (Curtis, 1829)" → "Dendrocerus carpenteri"
export function canonicalOf(taxon) {
  const words = String(taxon?.full_name_tag || taxon?.name || '')
    .replace(/<[^>]+>/g, '')
    .replace(/[†]/g, '')
    .trim()
    .split(/\s+/)
  const out = [words[0]]
  for (const w of words.slice(1)) {
    if (/^[a-z][a-z-]+$/.test(w)) out.push(w)
    else break
  }
  return out.filter(Boolean).join(' ')
}
export const rankOf = (taxon) => String(taxon?.rank || taxon?.rank_string || '').toLowerCase().split('::').pop()

// DwC rows that belong to the taxon on the page (species, genus, family or all)
export function inScope(otuId, taxon) {
  const m = matcher(otuId, taxon)
  return (r) => m({ id: Number(r.otu_id), genus: r.genus, family: r.family })
}

// a scaled image from TaxonWorks
export function boxed(png, bw, bh) {
  const m = String(png || '').match(/images\/(\d+)\/scale_to_box\/0\/0\/(\d+)\/(\d+)\//)
  if (!m) return ''
  const [id, w, h] = [m[1], Number(m[2]), Number(m[3])]
  const k = Math.min(1, bw / w, bh / h)
  return `${API}/images/${id}/scale_to_box/0/0/${w}/${h}/${Math.round(w * k)}/${Math.round(h * k)}?project_token=${TOKEN}`
}
export const fullImage = (png, fallback) => (png ? `${API}/${String(png).replace(/^\/api\/v1\//, '')}?project_token=${TOKEN}` : fallback)

function isPhoneFrame(png) {
  const m = String(png || '').match(/scale_to_box\/0\/0\/(\d+)\/(\d+)\//)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])].sort((x, y) => y - x)
  return (a === 4032 && b === 3024) || (a === 4000 && b === 3000) || (a === 4624 && b === 3468)
}
function rankImg(text, png) {
  const t = text.toLowerCase()
  if (/\blabels?\b/.test(t)) return 50
  if (isPhoneFrame(png)) return 40
  if (/whole body|habitus/.test(t)) return 0
  if (/\b(dorsal|lateral)\b/.test(t)) return 1
  if (/\b(ventral|anterior|frontal|head|mesosoma|metasoma)\b/.test(t)) return 10
  return 20
}
const viewName = (label) => {
  const m = String(label || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\s*(.*)$/i)
  return m ? m[1].replace(/\s*\(CollectionObject\)\.?\s*$/, '').replace(/\.$/, '').trim() : ''
}

// images of an OTU, specimen views first (cached per visit)
const imgCache = new Map()
export function otuImages(otuId) {
  if (!otuId) return Promise.resolve([])
  if (imgCache.has(otuId)) return imgCache.get(otuId)
  const p = makeAPIRequest
    .get(`/otus/${otuId}/inventory/images.json`, { params: { extend: ['depictions'], otu_scope: ['all', 'coordinate_otus'] } })
    .then(({ data }) =>
      (data?.image_order || [])
        .filter(Boolean)
        .map((id, i) => {
          const im = data.images[id] || {}
          const label = (im.depictions || []).map((d) => d.label || d.caption || '').join(' ')
          return {
            id,
            i,
            label,
            png: im.original_png,
            thumb: boxed(im.original_png, 200, 150) || im.thumb,
            card: boxed(im.original_png, 640, 480) || im.medium,
            big: boxed(im.original_png, 1600, 1200) || im.medium,
            full: fullImage(im.original_png, im.medium),
            view: viewName(label),
            rank: rankImg(label, im.original_png)
          }
        })
        .sort((a, b) => a.rank - b.rank || a.i - b.i)
    )
    .catch(() => [])
  imgCache.set(otuId, p)
  return p
}

// the identification keys of the project, with the name of the taxon each covers
let keysPending = null
export function loadKeys() {
  if (keysPending) return keysPending
  keysPending = (async () => {
    const { data } = await makeAPIRequest.get('/leads', { params: { per: 1000 } })
    const leads = Array.isArray(data) ? data : []
    const ids = [...new Set(leads.map((l) => l.otu_id).filter(Boolean))]
    const names = {}
    if (ids.length) {
      const { data: otus } = await makeAPIRequest.get('/otus', { params: { 'otu_id[]': ids, per: 500 } }).catch(() => ({ data: [] }))
      ;(otus || []).forEach((o) => (names[o.id] = String(o.object_tag || o.name || '').replace(/<[^>]+>/g, '').split(/\s+/)[0]))
    }
    const trees = await Promise.all(
      leads.map((l) =>
        makeAPIRequest
          .get(`/leads/key/${l.id}`)
          .then(({ data }) => Object.values(data?.data?.leads || {}).map((x) => `${x.text || ''} ${x.target_label || ''}`).join(' \n '))
          .catch(() => '')
      )
    )
    return leads.map((l, i) => ({ id: l.id, title: String(l.text || '').trim(), scope: names[l.otu_id] || '', text: trees[i] }))
  })().catch(() => {
    keysPending = null
    return []
  })
  return keysPending
}

// the GBIF backbone entry for an exact name (cached)
const gbifCache = new Map()
export function gbifOf(name) {
  if (!name) return Promise.resolve(null)
  if (gbifCache.has(name)) return gbifCache.get(name)
  const p = (async () => {
    const g = await (await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Animalia&order=Hymenoptera`)).json()
    if (!g.usageKey || g.matchType === 'HIGHERRANK' || String(g.canonicalName || '').toLowerCase() !== name.toLowerCase()) return null
    const key = g.acceptedUsageKey || g.usageKey
    const c = await (await fetch(`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&limit=0`)).json()
    return { key, status: String(g.status || '').toLowerCase(), occ: c.count ?? null }
  })().catch(() => null)
  gbifCache.set(name, p)
  return p
}
