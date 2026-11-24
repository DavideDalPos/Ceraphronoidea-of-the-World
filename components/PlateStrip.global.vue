<template>
  <section class="cow-ps">
    <div class="cow-ps__inner">
      <div class="cow-ps__text">
        <slot />
      </div>
      <div class="cow-ps__scope">
        <div
          v-if="!src"
          class="cow-ps__ring cow-ps__ring--amber"
          aria-hidden="true"
        >
          <span>{{ alt || 'Cretaceous' }}</span>
        </div>
        <button
          v-else
          type="button"
          class="cow-ps__ring"
          title="Click to enlarge"
          :aria-label="`Enlarge photo of ${taxon || alt}`"
          @click="open = true"
        >
          <img
            :src="resolvedSrc"
            :alt="alt"
            :style="{ objectPosition: position }"
          />
          <span
            class="cow-hh__reticle"
            aria-hidden="true"
          />
          <span class="cow-hh__zoom">⤢ Enlarge</span>
        </button>
        <div
          v-if="taxon"
          class="cow-hh__label cow-ps__label"
        >
          <p class="cow-hh__label-name">
            <i>{{ taxon }}</i> {{ citation }}
          </p>
          <p
            v-if="credit"
            class="cow-hh__label-meta"
          >
            {{ credit.replace(/^Photo by:\s*/i, 'photo ') }}
          </p>
        </div>
      </div>
    </div>
    <ProjectMetrics v-if="metrics" />

    <Teleport to="body">
      <div
        v-if="open"
        class="cow-viewer"
        role="dialog"
        aria-modal="true"
        @click.self="open = false"
        @keydown.esc="open = false"
      >
        <button
          type="button"
          class="cow-viewer__close"
          aria-label="Close"
          @click="open = false"
        >
          ×
        </button>
        <figure class="cow-viewer__fig">
          <img
            :src="resolvedSrc"
            :alt="alt"
          />
          <figcaption>
            <span v-if="taxon"><i>{{ taxon }}</i> {{ citation }}</span>
            <span v-if="credit">{{ credit }}</span>
          </figcaption>
        </figure>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { resolveAssetUrl } from '@/utils/url'
import ProjectMetrics from './ProjectMetrics.vue'

const { base_url } = __APP_ENV__

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  taxon: { type: String, default: '' },
  citation: { type: String, default: '' },
  credit: { type: String, default: 'Photo by: István Mikó' },
  corner: { type: String, default: 'bottom-left' },
  position: { type: String, default: 'center' },
  metrics: { type: Boolean, default: false }
})

const open = ref(false)
const resolvedSrc = computed(() => (props.src ? resolveAssetUrl(props.src, base_url) : ''))
const onKey = (e) => e.key === 'Escape' && (open.value = false)
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
