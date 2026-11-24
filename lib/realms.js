// Outlines of the biogeographic realms, taken from TaxonWorks itself: the
// distribution map of a species recorded from a single realm IS that realm's
// shape. Simplified to a light SVG path and kept in the browser for a week.
import { makeAPIRequest } from '@/utils/request'

const KEY = 'cow-realm-shapes-v1'
const TTL = 7 * 24 * 3600 * 1000

// longitude/latitude → SVG units (equirectangular, 1 unit = 1 degree)
const X = (lon) => +(lon + 180).toFixed(1)
const Y = (lat) => +(90 - lat).toFixed(1)

function ringPath(ring) {
  const kept = []
  let last = null
  for (const [lon, lat] of ring) {
    if (!last || Math.abs(lon - last[0]) + Math.abs(lat - last[1]) >= 0.4) {
      kept.push([lon, lat])
      last = [lon, lat]
    }
  }
  if (kept.length < 4) return ''
  return 'M' + kept.map(([lon, lat]) => `${X(lon)} ${Y(lat)}`).join('L') + 'Z'
}

function toPath(geo) {
  const polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.type === 'MultiPolygon' ? geo.coordinates : []
  return polys.map((poly) => poly.map(ringPath).join('')).join('')
}

/** realmOtus: { Afrotropical: otuId, … } → { Afrotropical: 'M…Z', … } */
export async function realmShapes(realmOtus) {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (c && Date.now() - c.t < TTL && Object.keys(realmOtus).every((r) => c.paths[r])) return c.paths
  } catch {
    /* storage blocked */
  }
  const entries = await Promise.all(
    Object.entries(realmOtus).map(async ([realm, otu]) => {
      try {
        const { data } = await makeAPIRequest.get(`/otus/${otu}/inventory/distribution`)
        const geo = JSON.parse(data?.cached_map?.geo_json || 'null')
        return [realm, geo ? toPath(geo) : '']
      } catch {
        return [realm, '']
      }
    })
  )
  const paths = Object.fromEntries(entries.filter(([, p]) => p))
  try {
    localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), paths }))
  } catch {
    /* full or blocked */
  }
  return paths
}
