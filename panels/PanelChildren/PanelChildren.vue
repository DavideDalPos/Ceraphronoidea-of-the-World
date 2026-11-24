<template>
  <section
    v-if="loading || children.length || synonyms.length"
    class="cow-ch"
  >
    <header class="cow-ch__head">
      <h2 class="cow-ch__title">
        {{ childLabel }}
        <span v-if="children.length">{{ children.length }}</span>
      </h2>
      <input
        v-if="children.length > 12"
        v-model="q"
        type="search"
        class="cow-ch__search"
        :placeholder="`Find a ${childLabel.toLowerCase().replace(/s$/, '')}…`"
        :aria-label="`Search ${childLabel.toLowerCase()}`"
      />
    </header>

    <p
      v-if="loading"
      class="cow-ch__muted"
    >
      Loading…
    </p>

    <!-- synonyms of this taxon -->
    <div
      v-if="synonyms.length"
      class="cow-ch__syn"
    >
      <p class="cow-ch__kicker">Synonyms of this {{ rankWord }}</p>
      <ul>
        <li
          v-for="s in synonyms"
          :key="s.html"
        >
          <RouterLink
            v-if="s.otuId"
            :to="{ name: 'otus-id-overview', params: { id: String(s.otuId) } }"
            v-html="s.html"
          />
          <span
            v-else
            v-html="s.html"
          />
        </li>
      </ul>
    </div>

    <!-- valid children, with their synonyms on demand -->
    <ul
      v-if="shown.length"
      class="cow-ch__list"
    >
      <li
        v-for="c in shown"
        :key="c.id"
        class="cow-ch__item"
      >
        <div class="cow-ch__row">
          <RouterLink
            :to="{ name: 'otus-id-overview', params: { id: String(c.id) } }"
            class="cow-ch__name"
            v-html="c.html"
          />
          <span
            v-if="c.count"
            class="cow-ch__count"
            :title="`${c.count} below`"
            >{{ c.count }}</span
          >
          <button
            v-if="c.synonyms.length"
            type="button"
            class="cow-ch__synbtn"
            :aria-expanded="!!open[c.id]"
            @click="open[c.id] = !open[c.id]"
          >
            {{ c.synonyms.length }} syn.
          </button>
        </div>
        <ul
          v-if="open[c.id]"
          class="cow-ch__sublist"
        >
          <li
            v-for="s in c.synonyms"
            :key="s.html"
          >
            <span class="cow-ch__eq">=</span>
            <RouterLink
              v-if="s.otuId"
              :to="{ name: 'otus-id-overview', params: { id: String(s.otuId) } }"
              v-html="s.html"
            />
            <span
              v-else
              v-html="s.html"
            />
          </li>
        </ul>
      </li>
    </ul>
    <p
      v-else-if="q"
      class="cow-ch__muted"
    >
      Nothing matches “{{ q }}”.
    </p>
    <button
      v-if="filtered.length > LIMIT && !q"
      type="button"
      class="cow-ch__more"
      @click="all = !all"
    >
      {{ all ? 'Show fewer' : `Show all ${filtered.length}` }}
    </button>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils/request'

const props = defineProps({
  otuId: { type: [Number, String], default: null },
  taxon: { type: Object, default: () => ({}) }
})

const LIMIT = 30
const loading = ref(true)
const tree = ref(null)
const q = ref('')
const all = ref(false)
const open = reactive({})

const strip = (h) => String(h || '').replace(/<[^>]+>/g, '')
const rankWord = computed(() => String(props.taxon?.rank || 'taxon').toLowerCase())
const childLabel = computed(() => {
  const r = rankWord.value
  if (/^(genus|subgenus)$/.test(r)) return 'Species'
  if (/species/.test(r)) return 'Subspecies'
  if (/family|tribe/.test(r)) return 'Genera'
  return 'Included taxa'
})

async function load() {
  loading.value = true
  tree.value = null
  q.value = ''
  all.value = false
  Object.keys(open).forEach((k) => delete open[k])
  if (!props.otuId) return
  try {
    const { data } = await makeAPIRequest.get(`/otus/${props.otuId}/inventory/taxonomy.json`)
    tree.value = data
  } catch {
    tree.value = null
  } finally {
    loading.value = false
  }
}
watch(() => props.otuId, load, { immediate: true })

const synList = (node) =>
  (node?.nomenclatural_synonyms || []).map((html, i) => ({ html, otuId: (node.nomenclatural_synonyms_otu_id || [])[i] }))

function countLeaves(node) {
  const d = node?.descendants || []
  return d.length ? d.reduce((n, c) => n + (c.descendants?.length ? countLeaves(c) : 1), 0) : 0
}

const synonyms = computed(() => synList(tree.value))
const children = computed(() =>
  (tree.value?.descendants || [])
    .map((c) => ({ id: c.otu_id, html: c.name, text: strip(c.name), count: countLeaves(c), synonyms: synList(c) }))
    .sort((a, b) => a.text.localeCompare(b.text))
)
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return children.value
  return children.value.filter((c) => c.text.toLowerCase().includes(term) || c.synonyms.some((s) => strip(s.html).toLowerCase().includes(term)))
})
const shown = computed(() => (all.value || q.value ? filtered.value : filtered.value.slice(0, LIMIT)))
</script>
