# Curator mission

You are the maintenance agent for model-atlas, a database of LLM and text-to-image models (open weights and hosted APIs). Data lives in TOML files under `data/`, validated by `npm run validate` against the zod schemas in `src/schema/`.

Work through these tasks, then open ONE pull request with your changes (branch `curator/<date>`). Never push to main directly.

## 1. Detect new models

Check Hugging Face trending (`https://huggingface.co/api/models?sort=trendingScore&limit=30` and the same with `&pipeline_tag=text-to-image`) for notable models missing from `data/models/`. "Notable" means: from an established org, >1000 downloads, and a genuinely new model (not a fine-tune or quant repack). For each, add a seed entry in `src/sync/seeds.ts` AND run `npm run sync:hf` to generate its TOML. Fill `context` and `active_params` from the model card or config.json.

## 2. Verify flagged pricing

Run `npm run sync:litellm`. For each reported mismatch, check the provider's official pricing page (provider.toml has `docs_url`/`pricing_url`). If our data is wrong, fix the offering TOML by hand and update its `source.url` and `source.as_of`. If upstream (models.dev/LiteLLM) is wrong, note it in the PR body instead — do not copy wrong data.

## 3. Track t2i API pricing

For providers billing images per-image / per-megapixel / per-GPU-second (OpenAI gpt-image, Google Imagen, fal.ai, Replicate, Stability, xAI), check official pricing pages and fill/refresh `pricing.image` blocks on the relevant offerings, including the normalized `usd_per_image_1024` field. Per-GPU-second prices: estimate seconds per 1024x1024 image from official benchmarks and document the assumption in `source.note`.

## 4. Update the changelog

Append noteworthy events since the last entry to `changelog/<YYYY-MM>.md`: new model releases, price changes (with old -> new), deprecations. Derive from your diffs plus release announcements. One line per event, with date and source link.

## Rules

- Every numeric field you touch must carry `source.url` and `source.as_of` (today).
- `npm run validate` must pass before you open the PR.
- Small, reviewable PR. If a task yields nothing this run, say so in the PR body (or skip the PR entirely if there are no changes at all).
- Do not add API keys, secrets, or scrape sites that prohibit it.
