<template>
  <TaxonHero
    v-if="store.taxon?.id && store.otu?.id"
    :key="store.otu.id"
    :otu="store.otu"
    :otu-id="store.otu.id"
    :taxon="store.taxon"
  />
</template>

<script setup>
import TaxonHero from './TaxonHero.vue'

const props = defineProps({ useStore: { type: Function, required: true } })
const store = props.useStore()
</script>
