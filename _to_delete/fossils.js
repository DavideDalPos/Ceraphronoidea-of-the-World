// Deposits and ages of fossil Ceraphronoidea, compiled from the original
// descriptions (not stored in TaxonWorks). Ages in million years (Ma), a
// midpoint and a range. `check: true` marks entries to confirm.
// lat/lon are approximate, for a future map of the deposits.

export const DEPOSITS = {
  lebanese: { name: 'Lebanese amber', place: 'Lebanon', age: 127, min: 125, max: 130, epoch: 'Early Cretaceous (Barremian)', lat: 33.9, lon: 35.7 },
  baissa: { name: 'Baissa', place: 'Transbaikalia, Russia', age: 130, min: 125, max: 135, epoch: 'Early Cretaceous', lat: 52.6, lon: 115.0, check: true },
  bontsagan: { name: 'Bon-Tsagan', place: 'Mongolia', age: 120, min: 113, max: 125, epoch: 'Early Cretaceous (Aptian)', lat: 45.6, lon: 99.0, check: true },
  spanish: { name: 'Spanish amber (Álava)', place: 'Basque Country, Spain', age: 105, min: 100, max: 110, epoch: 'Early Cretaceous (Albian)', lat: 42.7, lon: -2.7 },
  burmese: { name: 'Burmese (Kachin) amber', place: 'Myanmar', age: 99, min: 98, max: 100, epoch: 'Late Cretaceous (Cenomanian)', lat: 26.2, lon: 96.6 },
  taimyr: { name: 'Taimyr amber (Yantardakh)', place: 'Taimyr, Russia', age: 85, min: 83, max: 87, epoch: 'Late Cretaceous (Santonian)', lat: 71.5, lon: 104.0 },
  canadian: { name: 'Canadian amber', place: 'Alberta & Manitoba, Canada', age: 78, min: 76, max: 80, epoch: 'Late Cretaceous (Campanian)', lat: 49.8, lon: -111.6 },
  baltic: { name: 'Baltic amber', place: 'Baltic region', age: 42, min: 34, max: 48, epoch: 'Eocene', lat: 54.9, lon: 20.4 }
}

// species → deposit (by name, so it survives id changes)
export const FOSSIL_DEPOSIT = {
  'Allocotidus bruesi': 'canadian',
  'Aphrostigmon bontsaganicum': 'bontsagan',
  'Aphrostigmon priapulus': 'bontsagan',
  'Aphrostigmon vitimense': 'baissa',
  'Burmaphron iratxoak': 'burmese',
  'Burmaphron jentilak': 'burmese',
  'Burmaphron sorginak': 'burmese',
  'Elasmomorpha melpomene': 'taimyr',
  'Hippocoon evadne': 'taimyr',
  'Hippocoon basajauni': 'spanish',
  'Libanophron sugaar': 'lebanese',
  'Stigmaphron orphne': 'taimyr',
  'Tagsmiphron exitorum': 'canadian',
  'Tagsmiphron leucki': 'canadian',
  'Tagsmiphron spiculum': 'canadian',
  'Tagsmiphron olentzero': 'spanish',
  'Prolagynodes penniger': 'taimyr',
  'Conostigmus dolicharthrus': 'taimyr',
  'Dendrocerus dubitatus': 'canadian',
  'Lagynodes electriphilus': 'baltic',
  'Lagynodes primordialis': 'baltic',
  'Lagynodes pseudocarinatus': 'baltic',
  'Conostigmus juvenilis': 'baltic',
  'Conostigmus resinae': 'baltic',
  'Conostigmus succinalis': 'baltic'
  // Ceraphron fasciatus and Aphanogmus serrulatus (Meunier, 1917): deposit to confirm
}

export const FAMILY_OF_GENUS = {
  Allocotidus: 'Stigmaphronidae',
  Aphrostigmon: 'Stigmaphronidae',
  Burmaphron: 'Stigmaphronidae',
  Elasmomorpha: 'Stigmaphronidae',
  Hippocoon: 'Stigmaphronidae',
  Libanophron: 'Stigmaphronidae',
  Stigmaphron: 'Stigmaphronidae',
  Tagsmiphron: 'Stigmaphronidae',
  Lagynodes: 'Megaspilidae',
  Prolagynodes: 'Megaspilidae',
  Conostigmus: 'Megaspilidae',
  Dendrocerus: 'Megaspilidae',
  Megaspilus: 'Megaspilidae',
  Trichosteresis: 'Megaspilidae',
  Ceraphron: 'Ceraphronidae',
  Aphanogmus: 'Ceraphronidae'
}

// geological periods for the timeline background (Ma)
export const PERIODS = [
  { name: 'Early Cretaceous', from: 145, to: 100.5 },
  { name: 'Late Cretaceous', from: 100.5, to: 66 },
  { name: 'Paleogene', from: 66, to: 23 },
  { name: 'Neogene', from: 23, to: 2.6 },
  { name: 'Q.', from: 2.6, to: 0 }
]
export const periodOf = (ma) => (PERIODS.find((p) => ma <= p.from && ma >= p.to) || {}).name || ''

