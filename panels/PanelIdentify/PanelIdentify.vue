<template>
  <section
    v-if="fit.length"
    class="cow-pi"
  >
    <p class="cow-pi__kicker">
      Identify it
    </p>
    <ul class="cow-pi__list">
      <li
        v-for="k in fit"
        :key="k.id"
      >
        <RouterLink :to="`/keys/${k.id}`">
          <b>{{ k.title }}</b>
          <span :class="['cow-pi__tag', { 'is-here': k.reaches }]">{{ k.reaches ? `reaches ${shortName}` : `to ${k.scope === 'Ceraphronoidea' ? 'the genus' : `species of ${k.scope}`}` }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { canonicalOf, rankOf, loadKeys } from '../../lib/taxonPage.js'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxonId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})
const keys = ref([])
watch(
  () => props.otuId,
  async () => (keys.value = await loadKeys()),
  { immediate: true }
)
const name = computed(() => canonicalOf(props.taxon))
const shortName = computed(() => {
  const [g, e] = name.value.split(' ')
  return e ? `${g.charAt(0)}. ${e}` : g
})
// keys that lead to this taxon, or to its genus / to the genera of the superfamily
const fit = computed(() => {
  const [genus, epithet] = name.value.split(' ')
  const rank = rankOf(props.taxon)
  return keys.value
    .map((k) => ({ ...k, reaches: epithet ? k.text.includes(name.value) || k.text.includes(`${genus.charAt(0)}. ${epithet}`) : k.text.includes(genus) }))
    .filter((k) => k.reaches || k.scope === genus || (/species|genus/.test(rank) && k.scope === 'Ceraphronoidea'))
    .sort((a, b) => b.reaches - a.reaches || (a.scope === 'Ceraphronoidea') - (b.scope === 'Ceraphronoidea'))
})
</script>
