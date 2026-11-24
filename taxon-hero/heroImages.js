// Images for the taxon hero: the taxon's own images, or (for genera and
// higher taxa without their own) images of species inside it.
import { makeAPIRequest } from '@/utils/request'

const { url, project_token } = __APP_ENV__
const cache = new Map()

function depictionText(im) {
  return (im?.depictions || []).map((d) => `${d.label || ''} ${d.caption || ''} ${d.figure_label || ''}`).join(' ').toLowerCase()
}
// habitus first, slides and details next, label photos last (as in the gallery)
// phone-camera frames (4032 × 3024 and similar) are, in this project, snapshots
// of specimen labels; microscope photos have other sizes
function isPhoneFrame(im) {
  const m = String(im.original_png || '').match(/scale_to_box\/0\/0\/(\d+)\/(\d+)\//)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])].sort((x, y) => y - x)
  return (a === 4032 && b === 3024) || (a === 4000 && b === 3000) || (a === 4624 && b === 3468)
}

function rank(im) {
  const t = depictionText(im)
  if (/\blabels?\b/.test(t)) return 50
  if (isPhoneFrame(im)) return 40
  if (/dorsal\s*4x|lateral\s*4x/.test(t)) return 0
  if (/\b(dorsal|lateral|habitus)\b/.test(t)) return 1
  return 20
}
// the same image scaled to fit 1800 × 1400 px: fast to load, sharp on screen
function sized(png) {
  const m = String(png || '').match(/scale_to_box\/0\/0\/(\d+)\/(\d+)\//)
  if (!m) return ''
  const [w, h] = [Number(m[1]), Number(m[2])]
  const k = Math.min(1, 1800 / w, 1400 / h)
  return `${url}/images/${png.match(/images\/(\d+)/)[1]}/scale_to_box/0/0/${w}/${h}/${Math.round(w * k)}/${Math.round(h * k)}?project_token=${project_token}`
}

// label photos are tall and narrow and say "det." or "Holotype" in the depiction
function looksLikeLabels(im) {
  return /\b(labels?|det\.|holotype label)\b/i.test(im.caption || '')
}

// a short view name for filtering: habitus, head, wings, labels…
function viewOf(im) {
  const t = depictionText(im)
  if (/\blabels?\b/.test(t) || isPhoneFrame(im)) return 'Labels'
  if (/\b(head|face|frontal|anterior)\b/.test(t)) return 'Head'
  if (/\b(wing|wings)\b/.test(t)) return 'Wings'
  if (/\b(genitali|metasoma|mesosoma|antenna)/.test(t)) return 'Details'
  if (/\b(dorsal|lateral|ventral|habitus)\b/.test(t)) return 'Habitus'
  return 'Other'
}

function caption(im) {
  const d = (im.depictions || [])[0] || {}
  const raw = d.caption || d.figure_label || ''
  return String(raw).replace(/<[^>]+>/g, '').trim()
}

export async function imagesOf(otuId, signal) {
  const { data } = await makeAPIRequest.get(`/otus/${otuId}/inventory/images.json`, {
    signal,
    params: { extend: ['depictions', 'attribution'], otu_scope: ['all', 'coordinate_otus'] }
  })
  return (data?.image_order || [])
    .filter(Boolean)
    .map((id) => ({ id, ...data.images[id] }))
    .map((im, i) => ({
      id: im.id,
      thumb: im.thumb,
      medium: im.medium,
      full: im.original_png ? `${url}/${im.original_png.substring(8)}?project_token=${project_token}` : im.medium,
      display: sized(im.original_png) || im.medium,
      caption: caption(im),
      depiction: (im.depictions || [])[0]?.label || '',
      view: viewOf(im),
      credit: im.attribution?.label || '',
      rank: rank(im),
      i
    }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
}

export function leaves(node, out = []) {
  for (const d of node?.descendants || []) {
    if (d.leaf_node || !(d.descendants || []).length) out.push({ id: d.otu_id, name: d.name })
    else leaves(d, out)
  }
  return out
}

export async function heroImages(otuId, signal) {
  if (cache.has(otuId)) return cache.get(otuId)
  let list = await imagesOf(otuId, signal)
  let species = 0
  let fromDescendants = false
  try {
    const { data } = await makeAPIRequest.get(`/otus/${otuId}/inventory/taxonomy.json`, { signal })
    const ls = leaves(data)
    species = ls.length
    if (!list.filter((im) => im.rank < 50).length && ls.length) {
      // borrow the best image of up to 16 species: whole-wasp views first
      const picks = await Promise.all(
        ls.slice(0, 16).map((sp) =>
          imagesOf(sp.id, signal)
            .then((ims) => ims.filter((im) => im.rank < 50).slice(0, 1).map((im) => ({ ...im, taxon: sp.name, otuId: sp.id })))
            .catch(() => [])
        )
      )
      const all = picks.flat()
      const views = all.filter((im) => im.rank <= 1)
      const borrowed = (views.length ? views : all.filter((im) => !looksLikeLabels(im))).slice(0, 8)
      if (borrowed.length) {
        list = borrowed
        fromDescendants = true
      }
    }
  } catch {
    /* no taxonomy */
  }
  const out = { images: list.filter((im) => im.rank < 50 || list.length < 3).slice(0, 12), species, fromDescendants }
  cache.set(otuId, out)
  return out
}
