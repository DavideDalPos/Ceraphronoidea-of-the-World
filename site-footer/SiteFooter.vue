<template>
  <section class="cow-foot">
    <div class="cow-foot__inner">
      <div class="cow-foot__brand">
        <img
          :src="asset('/images/logo-aguinaldoi-512.png')"
          alt=""
          width="56"
          height="56"
        />
        <div>
          <p class="cow-foot__title">Ceraphronoidea of the World</p>
          <p class="cow-foot__lead">
            A curated, citable catalogue of ceraphronoid wasps: names, images, hosts, keys and specimens.
          </p>
        </div>
      </div>

      <nav
        class="cow-foot__col"
        aria-label="Explore"
      >
        <p class="cow-foot__h">Explore</p>
        <RouterLink :to="{ name: 'otus-id-overview', params: { id: '1373002' } }">Ceraphronoidea</RouterLink>
        <RouterLink :to="{ name: 'otus-id-overview', params: { id: '1372559' } }">Ceraphronidae</RouterLink>
        <RouterLink :to="{ name: 'otus-id-overview', params: { id: '1372988' } }">Megaspilidae</RouterLink>
        <RouterLink :to="{ name: 'otus-id-overview', params: { id: '1373001' } }">Stigmaphronidae</RouterLink>
      </nav>

      <nav
        class="cow-foot__col"
        aria-label="Tools"
      >
        <p class="cow-foot__h">Tools</p>
        <RouterLink to="/keys">Identification keys</RouterLink>
        <RouterLink to="/interactions">Hosts &amp; interactions</RouterLink>
        <RouterLink to="/atlas">Atlas</RouterLink>
        <RouterLink to="/types">Type specimens</RouterLink>
        <RouterLink to="/fossils">Fossils</RouterLink>
        <RouterLink to="/literature">Literature</RouterLink>
        <RouterLink to="/resources/tw/filter/dwc_otus">Specimen data</RouterLink>
      </nav>

      <nav
        class="cow-foot__col"
        aria-label="Project"
      >
        <p class="cow-foot__h">Project</p>
        <RouterLink to="/about">About &amp; team</RouterLink>
        <RouterLink to="/cite">How to cite</RouterLink>
        <a href="mailto:Istvan.Miko@unh.edu">Contact</a>
        <a
          href="https://github.com/Shanetiltongc/Ceraphronoidea-of-the-World"
          target="_blank"
          rel="noopener"
          >Source code</a
        >
        <a
          href="https://github.com/Shanetiltongc/Ceraphronoidea-of-the-World/issues/new"
          target="_blank"
          rel="noopener"
          >Report a problem</a
        >
      </nav>
    </div>
  </section>
</template>

<script setup>
import { resolveAssetUrl } from '@/utils/url'

const { base_url } = __APP_ENV__
const asset = (p) => resolveAssetUrl(p, base_url)
</script>
