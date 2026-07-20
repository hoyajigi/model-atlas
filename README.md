# model-atlas

Open database of **LLM and text-to-image models** — covering both open-weights models and hosted API offerings, in one schema.

What makes it different from models.dev / LiteLLM's pricing JSON:

- **Unified t2i coverage** — open-weights diffusion models (FLUX, SDXL, Qwen-Image, …) joined with API pricing normalized to `usd_per_image_1024` (per-image, per-megapixel, and per-GPU-second billing made comparable).
- **Hardware fit as data** — a (model × quant × hardware) table of measured VRAM and throughput under `data/hardware/`.
- **Korean benchmarks** — KMMLU, LogicKor and friends as machine-readable fields.

## Data layout

```
data/
├── models/{org}/{model}.toml            # model entity (provider-independent, open-weights specs)
├── providers/{provider}/provider.toml   # API provider
├── providers/{provider}/models/*.toml   # offering = model as sold by a provider (pricing, limits)
├── benchmarks/{suite}.toml              # benchmark suite definitions
└── hardware/                            # measured VRAM / tok/s / sec-per-image entries
```

Every numeric fact carries a `source.url` and `source.as_of` date. Schemas are defined with zod in `src/schema/` and exported as JSON Schema in `schema/`.

## Usage

```sh
npm ci
npm run validate        # schema + referential integrity checks
npm run build           # -> dist/api.json, dist/atlas.sqlite
```

Consume `dist/api.json` (all data, one file) or `dist/atlas.sqlite` for queries.

## Website

`site/` is an Astro static site (model browser, LLM API pricing, normalized t2i pricing, per-model pages) deployed to GitHub Pages on every push to main. `/api.json` is served alongside it.

```sh
npm run site:dev     # local dev server
npm run site:build   # data build + site build -> site/dist
```

## Maintenance

Two layers keep the data fresh:

1. **Deterministic sync** (`.github/workflows/sync.yml`, daily) — refreshes API offerings from [models.dev](https://models.dev) and open-weights specs from the Hugging Face Hub API, then cross-checks pricing against LiteLLM. Opens a PR when anything changed.
2. **Curator agent** (`.github/workflows/curator.yml`, twice a week) — a Claude Code agent following `.claude/commands/curate.md`: discovers new models, verifies flagged pricing against official pages, maintains t2i image pricing, and writes the changelog. All changes land as PRs; CI validates; a human merges.

## Sync scripts

```sh
npm run sync:modelsdev  # API offerings for allowlisted providers (models.dev, MIT)
npm run sync:hf         # open-weights model specs from HF Hub (seeds in src/sync/seeds.ts)
npm run sync:litellm    # pricing cross-check against LiteLLM (report only)
```

## Licenses & credits

Code is MIT. The dataset is CC-BY-4.0.

Upstream sources, with thanks: [models.dev](https://models.dev) (MIT), [LiteLLM](https://github.com/BerriAI/litellm) (MIT), [Hugging Face Hub](https://huggingface.co), [LMArena leaderboard-dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC-BY-4.0), [Epoch AI](https://epoch.ai/data) (CC-BY-4.0).
