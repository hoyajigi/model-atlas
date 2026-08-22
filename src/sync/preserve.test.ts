import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MANUAL_PRICING_TTL_DAYS,
  UPSTREAM_SOURCE_URL,
  preserveImagePricing,
  preserveManualPricing
} from './preserve.ts'

const ASOF = '2026-08-22'

const upstream = () => ({
  model_id: 'qwen3-next-80b-a3b-instruct',
  context: 131072,
  pricing: { input_per_mtok: 0.5, output_per_mtok: 2 },
  source: { url: UPSTREAM_SOURCE_URL, as_of: ASOF, note: 'synced from models.dev (MIT)' }
})

const curated = (asOf = ASOF) => ({
  pricing: { input_per_mtok: 0.15, output_per_mtok: 1.2 },
  source: {
    url: 'https://www.alibabacloud.com/help/en/model-studio/billing-for-model-studio',
    as_of: asOf,
    note: 'curator: price corrected to match official pricing page'
  }
})

test('a curated price survives regeneration', () => {
  const out = preserveManualPricing(upstream(), curated(), ASOF)
  assert.deepEqual(out.pricing, { input_per_mtok: 0.15, output_per_mtok: 1.2 })
})

test('the curated source block is kept so the override survives the next sync too', () => {
  const out = preserveManualPricing(upstream(), curated(), ASOF)
  assert.equal((out.source as Record<string, unknown>).url, curated().source.url)
})

test('non-pricing fields still come from upstream', () => {
  const out = preserveManualPricing(upstream(), curated(), ASOF)
  assert.equal(out.context, 131072)
})

test('a row last written by the sync itself is not treated as curated', () => {
  const existing = { pricing: { input_per_mtok: 9.99 }, source: { url: UPSTREAM_SOURCE_URL, as_of: ASOF } }
  const out = preserveManualPricing(upstream(), existing, ASOF)
  assert.deepEqual(out.pricing, { input_per_mtok: 0.5, output_per_mtok: 2 })
})

test('an override older than the TTL expires and upstream wins again', () => {
  const out = preserveManualPricing(upstream(), curated('2025-01-01'), ASOF)
  assert.deepEqual(out.pricing, { input_per_mtok: 0.5, output_per_mtok: 2 })
})

test('an override exactly at the TTL boundary still holds', () => {
  const boundary = new Date(Date.parse(`${ASOF}T00:00:00Z`) - MANUAL_PRICING_TTL_DAYS * 86_400_000)
  const out = preserveManualPricing(upstream(), curated(boundary.toISOString().slice(0, 10)), ASOF)
  assert.equal((out.pricing as Record<string, unknown>).input_per_mtok, 0.15)
})

test('an unparseable or missing as_of does not silently pin the price', () => {
  for (const asOf of ['', 'yesterday', undefined]) {
    const existing = { pricing: { input_per_mtok: 0.15 }, source: { url: 'https://example.com', as_of: asOf } }
    const out = preserveManualPricing(upstream(), existing, ASOF)
    assert.deepEqual(out.pricing, { input_per_mtok: 0.5, output_per_mtok: 2 }, `as_of=${String(asOf)}`)
  }
})

test('a first-time offering with no existing file is untouched', () => {
  assert.deepEqual(preserveManualPricing(upstream(), null, ASOF).pricing, upstream().pricing)
})

test('curated token pricing and curated image pricing coexist', () => {
  const existing = { ...curated(), pricing: { ...curated().pricing, image: { usd_per_image_1024: 0.04 } } }
  const out = preserveManualPricing(preserveImagePricing(upstream(), existing), existing, ASOF)
  assert.deepEqual(out.pricing, {
    input_per_mtok: 0.15,
    output_per_mtok: 1.2,
    image: { usd_per_image_1024: 0.04 }
  })
})
