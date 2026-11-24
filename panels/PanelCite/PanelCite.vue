<template>
  <section class="cow-cite-box">
    <p class="cow-cite-box__kicker">Cite this page</p>
    <p
      class="cow-cite-box__text"
      v-html="html"
    />
    <div class="cow-cite-box__actions">
      <button
        type="button"
        @click="copy(text, 'text')"
      >
        {{ copied === 'text' ? 'Copied ✓' : 'Copy citation' }}
      </button>
      <button
        type="button"
        @click="copy(bibtex, 'bib')"
      >
        {{ copied === 'bib' ? 'Copied ✓' : 'Copy BibTeX' }}
      </button>
      <RouterLink to="/cite">How to cite →</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})

const SITE = 'Ceraphronoidea of the World'
const ORIGIN = 'https://shanetiltongc.github.io/Ceraphronoidea-of-the-World'
const copied = ref('')

const now = new Date()
const accessed = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const iso = now.toISOString().slice(0, 10)
const nameHtml = computed(() => props.taxon?.full_name_tag || '')
const nameText = computed(() => String(nameHtml.value).replace(/<[^>]+>/g, ''))
const url = computed(() => `${ORIGIN}/#/otus/${props.otuId}/overview`)

const text = computed(() => `${nameText.value}. In: ${SITE}. Available from ${url.value} (accessed ${accessed}).`)
const html = computed(
  () => `${nameHtml.value}. In: <i>${SITE}</i>. Available from <a href="${url.value}">${url.value}</a> (accessed ${accessed}).`
)
const bibtex = computed(() => {
  const key = `cow_${String(nameText.value).split(/\s+/).slice(0, 2).join('_').replace(/[^A-Za-z_]/g, '')}`
  return `@misc{${key},
  title = {${nameText.value}},
  howpublished = {${SITE}},
  url = {${url.value}},
  note = {Accessed ${iso}}
}`
})

async function copy(value, which) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = which
    setTimeout(() => (copied.value = ''), 2000)
  } catch {
    /* clipboard blocked */
  }
}
</script>
