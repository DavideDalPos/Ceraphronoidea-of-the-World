// The association records of the taxon shown on the page (with its species,
// for genera and higher taxa), plus a few summaries.
import { computed, ref, watch } from 'vue'
import { loadAssociations, matcher } from './associations.js'

export function useTaxonHosts(props) {
  const loading = ref(true)
  const asSubject = ref([])
  const asObject = ref([])

  async function load() {
    loading.value = true
    try {
      const all = await loadAssociations()
      const mine = matcher(props.otuId, props.taxon)
      asSubject.value = all.filter((r) => mine(r.s))
      asObject.value = all.filter((r) => mine(r.o) && !mine(r.s))
    } catch {
      asSubject.value = []
      asObject.value = []
    } finally {
      loading.value = false
    }
  }
  watch(() => [props.otuId, props.taxon?.id], load, { immediate: true })

  const rows = computed(() => [...asSubject.value, ...asObject.value])
  const animal = computed(() => asSubject.value.filter((r) => r.rel !== 'feeds on'))
  const plants = computed(() => asSubject.value.filter((r) => r.rel === 'feeds on'))
  const refs = computed(() => new Set(rows.value.flatMap((r) => (r.cit ? r.cit.split(/;\s*/) : []))).size)
  const hostCount = computed(() => new Set(animal.value.map((r) => r.o.id || r.o.label)).size)
  const familyCount = computed(() => new Set(animal.value.map((r) => r.o.family).filter(Boolean)).size)
  const speciesCount = computed(() => new Set(asSubject.value.map((r) => r.s.id)).size)
  const orders = computed(() => {
    const m = new Map()
    animal.value.forEach((r) => {
      const k = r.o.order || 'Order not recorded'
      m.set(k, (m.get(k) || 0) + 1)
    })
    return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)
  })
  const families = computed(() => {
    const m = new Map()
    animal.value.forEach((r) => {
      if (!r.o.family) return
      const k = r.o.family
      if (!m.has(k)) m.set(k, { name: k, order: r.o.order, hosts: new Set() })
      m.get(k).hosts.add(r.o.id || r.o.label)
    })
    return [...m.values()].map((f) => ({ ...f, n: f.hosts.size })).sort((a, b) => b.n - a.n)
  })

  return { loading, rows, asSubject, asObject, animal, plants, refs, hostCount, familyCount, speciesCount, orders, families }
}
