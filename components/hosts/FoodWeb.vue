<template>
  <section class="cow-fw">
    <header class="cow-fw__head">
      <div>
        <h2 class="cow-ix__h2">Food web</h2>
        <p class="cow-ix__help">
          From a ceraphronoid genus to its hosts, their own hosts, and the plants those feed on. Hover a name to follow its
          links; click a ceraphronoid to open its page.
        </p>
      </div>
      <label class="cow-fw__pick">
        Genus
        <select v-model="genus">
          <option
            v-for="g in genera"
            :key="g.name"
            :value="g.name"
          >
            {{ g.name }} ({{ g.n }})
          </option>
        </select>
      </label>
    </header>

    <div class="cow-fw__cols">
      <span
        v-for="(c, i) in COLUMNS"
        :key="c"
        :style="{ left: `${colX(i) / W * 100}%` }"
        >{{ c }}</span
      >
    </div>
    <div class="cow-fw__wrap">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="cow-fw__svg"
        role="img"
        :aria-label="`Food web of ${genus}`"
      >
        <path
          v-for="(l, i) in layout.links"
          :key="`l${i}`"
          :d="l.d"
          :class="['cow-fw__link', `k${l.layer}`, { 'is-dim': hover && !l.on, 'is-on': hover && l.on }]"
        />
        <g
          v-for="n in layout.nodes"
          :key="n.key"
          :class="['cow-fw__node', `k${n.layer}`, { 'is-dim': hover && !n.on, 'is-link': n.link }]"
          :transform="`translate(${n.x},${n.y})`"
          @mouseenter="hover = n.key"
          @mouseleave="hover = ''"
          @click="n.link && router.push(n.link)"
        >
          <circle :r="Math.min(9, 3.5 + Math.sqrt(n.deg) * 1.5)" />
          <text
            :x="n.layer === 3 ? -14 : 14"
            dy="0.35em"
            :text-anchor="n.layer === 3 ? 'end' : 'start'"
          >
            {{ n.label }}
          </text>
          <title>{{ n.full }}</title>
        </g>
      </svg>
    </div>
    <p class="cow-ix__note">
      Each link is a published record. Links two or more steps apart can come from different papers, so they show
      possible chains, not one observed chain; the curated chains from single papers are on each species' Hosts tab.
    </p>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isCeraphronoid } from '../../panels/PanelHosts/associations.js'

const props = defineProps({ rows: { type: Array, default: () => [] } })
const router = useRouter()
const COLUMNS = ['Ceraphronoid', 'Host', "Host's host", 'Plant']
const W = 1200
const PER = 16 // nodes per column before "+ more"
const hover = ref('')

const genera = computed(() => {
  const m = new Map()
  props.rows.forEach((r) => {
    if (isCeraphronoid(r.s) && r.rel !== 'feeds on' && r.s.genus) m.set(r.s.genus, (m.get(r.s.genus) || 0) + 1)
  })
  return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)
})
const genus = ref('')
watch(genera, (g) => !genus.value && g[0] && (genus.value = g[0].name), { immediate: true })

const short = (l) => {
  const m = String(l).match(/^([A-Z])[a-z]+\s+(?:\([A-Za-z]+\)\s+)?([a-z][a-z-]+)/)
  if (m) return `${m[1]}. ${m[2]}`
  // genus or higher, with or without author: just the name
  return String(l).split(/\s+/)[0]
}
const keyOf = (t) => String(t.id || t.label)

const graph = computed(() => {
  const animal = props.rows.filter((r) => r.rel !== 'feeds on')
  const plants = props.rows.filter((r) => r.rel === 'feeds on')
  const L = [new Map(), new Map(), new Map(), new Map()]
  const edges = []
  const add = (layer, t) => {
    const k = keyOf(t)
    if (!L[layer].has(k)) L[layer].set(k, { key: `${layer}:${k}`, id: k, layer, t, deg: 0 })
    return L[layer].get(k)
  }
  animal.filter((r) => isCeraphronoid(r.s) && r.s.genus === genus.value).forEach((r) => {
    const a = add(0, r.s)
    const b = add(1, r.o)
    edges.push([a, b])
  })
  const l1 = new Set(L[1].keys())
  animal.filter((r) => l1.has(keyOf(r.s)) && !isCeraphronoid(r.o)).forEach((r) => {
    edges.push([L[1].get(keyOf(r.s)), add(2, r.o)])
  })
  const l12 = new Set([...L[1].keys(), ...L[2].keys()])
  plants.filter((r) => l12.has(keyOf(r.s))).forEach((r) => {
    const from = L[2].get(keyOf(r.s)) || L[1].get(keyOf(r.s))
    edges.push([from, add(3, r.o)])
  })
  // de-duplicate edges and count degree
  const seen = new Set()
  const uniq = edges.filter(([a, b]) => {
    const k = `${a.key}>${b.key}`
    if (seen.has(k)) return false
    seen.add(k)
    a.deg++
    b.deg++
    return true
  })
  return { layers: L.map((m) => [...m.values()].sort((a, b) => b.deg - a.deg)), edges: uniq }
})

const colX = (i) => [30, 360, 690, 1170][i]
const H = computed(() => Math.max(260, Math.max(...graph.value.layers.map((l) => Math.min(l.length, PER + 1))) * 30 + 30))

const layout = computed(() => {
  const nodes = []
  const pos = new Map()
  graph.value.layers.forEach((list, li) => {
    const shownN = list.slice(0, PER)
    const extra = list.length - shownN.length
    const count = shownN.length + (extra ? 1 : 0)
    const gap = (H.value - 30) / Math.max(1, count)
    shownN.forEach((n, i) => {
      const y = 15 + gap * (i + 0.5)
      const link = n.layer === 0 || isCeraphronoid(n.t) ? { name: 'otus-id-overview', params: { id: String(n.t.id) } } : null
      const node = { key: n.key, layer: li, x: colX(li), y, deg: n.deg, label: li === 3 ? String(n.t.label).split(' ').slice(0, 2).join(' ') : short(n.t.label), full: n.t.label + (n.t.family ? ` (${n.t.family})` : ''), link: n.t.id ? link : null }
      nodes.push(node)
      pos.set(n.key, node)
    })
    if (extra) nodes.push({ key: `more${li}`, layer: li, x: colX(li), y: 15 + gap * (count - 0.5), deg: 0, label: `+ ${extra} more`, full: `${extra} more`, link: null })
  })
  // what is connected to the hovered node (whole paths)
  const on = new Set()
  if (hover.value) {
    const fwd = (k) => graph.value.edges.filter(([a]) => a.key === k).forEach(([, b]) => !on.has(b.key) && (on.add(b.key), fwd(b.key)))
    const back = (k) => graph.value.edges.filter(([, b]) => b.key === k).forEach(([a]) => !on.has(a.key) && (on.add(a.key), back(a.key)))
    on.add(hover.value)
    fwd(hover.value)
    back(hover.value)
  }
  nodes.forEach((n) => (n.on = on.has(n.key)))
  const links = graph.value.edges
    .filter(([a, b]) => pos.has(a.key) && pos.has(b.key))
    .map(([a, b]) => {
      const p = pos.get(a.key)
      const q = pos.get(b.key)
      // start after the label, end just before the next dot
      const x0 = p.x + 18 + String(p.label).length * 6.6
      const x1 = q.layer === 3 ? q.x - 18 - String(q.label).length * 6.6 : q.x - 10
      const mx = (x0 + x1) / 2
      return { d: `M${x0},${p.y} C${mx},${p.y} ${mx},${q.y} ${x1},${q.y}`, layer: p.layer, on: on.has(a.key) && on.has(b.key) }
    })
  return { nodes, links }
})
</script>
