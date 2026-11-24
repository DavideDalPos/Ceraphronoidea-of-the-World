<template>
  <section
    v-if="!loading && rows.length"
    class="cow-hsum"
  >
    <header class="cow-hsum__head">
      <h2>Hosts &amp; associations</h2>
      <RouterLink :to="{ name: 'otus-id-hosts', params: { id: String(otuId) } }">See all →</RouterLink>
    </header>
    <dl class="cow-hsum__nums">
      <div v-if="hostCount">
        <dt>Host taxa</dt>
        <dd>{{ hostCount }}</dd>
      </div>
      <div v-if="familyCount">
        <dt>Host families</dt>
        <dd>{{ familyCount }}</dd>
      </div>
      <div v-if="plants.length">
        <dt>Plant records</dt>
        <dd>{{ plants.length }}</dd>
      </div>
      <div v-if="asObject.length">
        <dt>As host or prey</dt>
        <dd>{{ asObject.length }}</dd>
      </div>
      <div v-if="refs">
        <dt>References</dt>
        <dd>{{ refs }}</dd>
      </div>
    </dl>
    <ul
      v-if="orders.length"
      class="cow-hsum__bars"
    >
      <li
        v-for="o in orders.slice(0, 5)"
        :key="o.name"
      >
        <span class="cow-hsum__label">{{ o.name }}</span>
        <span class="cow-hsum__track"><span :style="{ width: `${(o.n / orders[0].n) * 100}%` }" /></span>
        <span class="cow-hsum__n">{{ o.n }}</span>
      </li>
    </ul>
    <p
      v-if="families.length"
      class="cow-hsum__fams"
    >
      <span
        v-for="f in families.slice(0, 8)"
        :key="f.name"
        >{{ f.name }}</span
      >
      <span
        v-if="families.length > 8"
        class="is-more"
        >+{{ families.length - 8 }} more</span
      >
    </p>
  </section>
</template>

<script setup>
import { useTaxonHosts } from '../PanelHosts/useTaxonHosts.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})
const { loading, rows, asObject, plants, refs, hostCount, familyCount, orders, families } = useTaxonHosts(props)
</script>
