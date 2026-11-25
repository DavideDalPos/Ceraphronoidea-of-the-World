---
title: About
contact_email: Istvan.Miko@unh.edu
citation: Ceraphronoidea of the World. Taxon pages served from TaxonWorks.
layout: fullwidth
---

<script setup>
import AboutPage from '../components/about/AboutPage.vue'
</script>

<plate-strip
  src="/images/about-crassicornis-strip.jpg"
  alt="Head and antenna of Ceraphron crassicornis"
  taxon="Ceraphron crassicornis"
  citation="Harrington, 1899"
  credit="Photo by: István Mikó"
  corner="bottom-left"
>
<div class="cow-intro cow-intro--right">
<h1 class="cow-title">{{ frontmatter.title }}</h1>
<p class="cow-lead">A world database of Ceraphronoidea: who they are, how the data are built, and who builds them.</p>
</div>
</plate-strip>

<AboutPage />
