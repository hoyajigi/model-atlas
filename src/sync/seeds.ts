/** Curated seed list of notable open-weights models, enriched via the HF Hub API. */
export interface Seed {
  hf_id: string
  org: string
  id: string
  family?: string
  /** Manual overrides the HF API cannot provide */
  context?: number
  active_params?: number
  /** Override when the HF pipeline_tag is ambiguous (e.g. image-to-image for t2i+edit models) */
  modality?: string
}

export const LLM_SEEDS: Seed[] = [
  { hf_id: 'Qwen/Qwen3.5-397B-A17B', org: 'qwen', id: 'qwen3.5-397b-a17b', family: 'qwen3.5', active_params: 17_000_000_000 },
  { hf_id: 'Qwen/Qwen3.5-122B-A10B', org: 'qwen', id: 'qwen3.5-122b-a10b', family: 'qwen3.5', active_params: 10_000_000_000 },
  { hf_id: 'Qwen/Qwen3.5-35B-A3B', org: 'qwen', id: 'qwen3.5-35b-a3b', family: 'qwen3.5', active_params: 3_000_000_000 },
  { hf_id: 'Qwen/Qwen3.5-27B', org: 'qwen', id: 'qwen3.5-27b', family: 'qwen3.5' },
  { hf_id: 'Qwen/Qwen3.5-9B', org: 'qwen', id: 'qwen3.5-9b', family: 'qwen3.5' },
  { hf_id: 'Qwen/Qwen3.5-4B', org: 'qwen', id: 'qwen3.5-4b', family: 'qwen3.5' },
  { hf_id: 'Qwen/Qwen-AgentWorld-35B-A3B', org: 'qwen', id: 'qwen-agentworld-35b-a3b', family: 'qwen-agentworld', active_params: 3_000_000_000 },
  { hf_id: 'Qwen/Qwen3-235B-A22B-Instruct-2507', org: 'qwen', id: 'qwen3-235b-a22b-instruct-2507', family: 'qwen3', context: 262144, active_params: 22_000_000_000 },
  { hf_id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', org: 'qwen', id: 'qwen3-coder-480b-a35b', family: 'qwen3', context: 262144, active_params: 35_000_000_000 },
  { hf_id: 'Qwen/Qwen3-32B', org: 'qwen', id: 'qwen3-32b', family: 'qwen3', context: 131072 },
  { hf_id: 'Qwen/Qwen3-30B-A3B-Instruct-2507', org: 'qwen', id: 'qwen3-30b-a3b-instruct-2507', family: 'qwen3', context: 262144, active_params: 3_300_000_000 },
  { hf_id: 'Qwen/Qwen3-8B', org: 'qwen', id: 'qwen3-8b', family: 'qwen3', context: 131072 },
  { hf_id: 'deepseek-ai/DeepSeek-V3-0324', org: 'deepseek', id: 'deepseek-v3-0324', family: 'deepseek-v3', context: 131072, active_params: 37_000_000_000 },
  { hf_id: 'deepseek-ai/DeepSeek-R1-0528', org: 'deepseek', id: 'deepseek-r1-0528', family: 'deepseek-r1', context: 131072, active_params: 37_000_000_000 },
  { hf_id: 'deepseek-ai/DeepSeek-V3.1', org: 'deepseek', id: 'deepseek-v3.1', family: 'deepseek-v3', context: 131072, active_params: 37_000_000_000 },
  { hf_id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', org: 'meta', id: 'llama-4-scout', family: 'llama-4', context: 10485760, active_params: 17_000_000_000 },
  { hf_id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct', org: 'meta', id: 'llama-4-maverick', family: 'llama-4', context: 1048576, active_params: 17_000_000_000 },
  { hf_id: 'meta-llama/Llama-3.3-70B-Instruct', org: 'meta', id: 'llama-3.3-70b-instruct', family: 'llama-3', context: 131072 },
  { hf_id: 'meta-llama/Llama-3.1-8B-Instruct', org: 'meta', id: 'llama-3.1-8b-instruct', family: 'llama-3', context: 131072 },
  { hf_id: 'google/gemma-3-27b-it', org: 'google', id: 'gemma-3-27b-it', family: 'gemma-3', context: 131072 },
  { hf_id: 'google/gemma-3-12b-it', org: 'google', id: 'gemma-3-12b-it', family: 'gemma-3', context: 131072 },
  { hf_id: 'google/gemma-3-4b-it', org: 'google', id: 'gemma-3-4b-it', family: 'gemma-3', context: 131072 },
  { hf_id: 'mistralai/Mistral-Small-3.2-24B-Instruct-2506', org: 'mistral', id: 'mistral-small-3.2-24b', family: 'mistral-small', context: 131072 },
  { hf_id: 'mistralai/Magistral-Small-2506', org: 'mistral', id: 'magistral-small-2506', family: 'magistral', context: 40960 },
  { hf_id: 'mistralai/Devstral-Small-2507', org: 'mistral', id: 'devstral-small-2507', family: 'devstral', context: 131072 },
  { hf_id: 'openai/gpt-oss-120b', org: 'openai', id: 'gpt-oss-120b', family: 'gpt-oss', context: 131072, active_params: 5_100_000_000 },
  { hf_id: 'openai/gpt-oss-20b', org: 'openai', id: 'gpt-oss-20b', family: 'gpt-oss', context: 131072, active_params: 3_600_000_000 },
  { hf_id: 'zai-org/GLM-4.6', org: 'zai', id: 'glm-4.6', family: 'glm-4', context: 202752, active_params: 32_000_000_000 },
  { hf_id: 'zai-org/GLM-4.5', org: 'zai', id: 'glm-4.5', family: 'glm-4', context: 131072, active_params: 32_000_000_000 },
  { hf_id: 'zai-org/GLM-4.5-Air', org: 'zai', id: 'glm-4.5-air', family: 'glm-4', context: 131072, active_params: 12_000_000_000 },
  { hf_id: 'moonshotai/Kimi-K2-Instruct', org: 'moonshotai', id: 'kimi-k2-instruct', family: 'kimi-k2', context: 131072, active_params: 32_000_000_000 },
  { hf_id: 'MiniMaxAI/MiniMax-M2', org: 'minimax', id: 'minimax-m2', family: 'minimax-m', context: 196608, active_params: 10_000_000_000 },
  { hf_id: 'microsoft/phi-4', org: 'microsoft', id: 'phi-4', family: 'phi', context: 16384 },
  { hf_id: 'LGAI-EXAONE/EXAONE-4.0-32B', org: 'lg', id: 'exaone-4.0-32b', family: 'exaone', context: 131072 },
  { hf_id: 'kakaocorp/kanana-1.5-8b-instruct-2505', org: 'kakao', id: 'kanana-1.5-8b-instruct', family: 'kanana', context: 32768 },
  { hf_id: 'upstage/Solar-Open2-250B', org: 'upstage', id: 'solar-open2-250b', family: 'solar' },
  { hf_id: 'upstage/Solar-Open-100B', org: 'upstage', id: 'solar-open-100b', family: 'solar' },
  { hf_id: 'naver-hyperclovax/HyperCLOVAX-SEED-Vision-Instruct-3B', org: 'naver', id: 'hyperclovax-seed-vision-3b', family: 'hyperclovax' },
  { hf_id: 'sarvamai/sarvam-105b', org: 'sarvam', id: 'sarvam-105b', family: 'sarvam' },
  { hf_id: 'sarvamai/sarvam-m', org: 'sarvam', id: 'sarvam-m', family: 'sarvam' },
  { hf_id: 'aisingapore/Qwen-SEA-LION-v4.5-27B-IT', org: 'aisingapore', id: 'qwen-sea-lion-v4.5-27b-it', family: 'sea-lion' },
  { hf_id: 'sbintuitions/sarashina2.2-3b-instruct-v0.1', org: 'sbintuitions', id: 'sarashina2.2-3b-instruct', family: 'sarashina' },
  { hf_id: 'CohereLabs/command-a-plus-05-2026-bf16', org: 'cohere', id: 'command-a-plus-05-2026', family: 'command' },
  { hf_id: 'Qwen/Qwen3.8-27B', org: 'qwen', id: 'qwen3.8-27b', family: 'qwen3.8' },
  { hf_id: 'Qwen/Qwen3.8-2.4T-A95B', org: 'qwen', id: 'qwen3.8-2.4t-a95b', family: 'qwen3.8', active_params: 95_000_000_000 },
  { hf_id: 'deepseek-ai/DeepSeek-V4-Pro', org: 'deepseek', id: 'deepseek-v4-pro', family: 'deepseek-v4', active_params: 49_000_000_000 },
  { hf_id: 'deepseek-ai/DeepSeek-V4-Flash', org: 'deepseek', id: 'deepseek-v4-flash', family: 'deepseek-v4', active_params: 13_000_000_000 },
  { hf_id: 'moonshotai/Kimi-K3', org: 'moonshotai', id: 'kimi-k3', family: 'kimi-k3', active_params: 104_000_000_000 },
  { hf_id: 'zai-org/GLM-5.3-Flash', org: 'zai', id: 'glm-5.3-flash', family: 'glm-5', active_params: 18_000_000_000 },
  { hf_id: 'Qwen/Qwen3.8-Flash-Next', org: 'qwen', id: 'qwen3.8-flash-next', family: 'qwen3.8' },
  { hf_id: 'tencent/Hy4-preview', org: 'tencent', id: 'hy4-preview', family: 'hy4', active_params: 49_000_000_000 }
]

export const T2I_SEEDS: Seed[] = [
  { hf_id: 'black-forest-labs/FLUX.1-dev', org: 'black-forest-labs', id: 'flux.1-dev', family: 'flux' },
  { hf_id: 'black-forest-labs/FLUX.1-schnell', org: 'black-forest-labs', id: 'flux.1-schnell', family: 'flux' },
  { hf_id: 'stabilityai/stable-diffusion-xl-base-1.0', org: 'stabilityai', id: 'sdxl-base-1.0', family: 'stable-diffusion' },
  { hf_id: 'stabilityai/stable-diffusion-3.5-large', org: 'stabilityai', id: 'sd-3.5-large', family: 'stable-diffusion' },
  { hf_id: 'Qwen/Qwen-Image', org: 'qwen', id: 'qwen-image', family: 'qwen-image' },
  { hf_id: 'black-forest-labs/FLUX.2-klein-4B', org: 'black-forest-labs', id: 'flux.2-klein-4b', family: 'flux', modality: 'text-to-image' },
  { hf_id: 'black-forest-labs/FLUX.2-klein-9B', org: 'black-forest-labs', id: 'flux.2-klein-9b', family: 'flux', modality: 'text-to-image' },
  { hf_id: 'krea/Krea-2-Raw', org: 'krea', id: 'krea-2-raw', family: 'krea' },
  { hf_id: 'Tongyi-MAI/Z-Image-Turbo', org: 'tongyi-mai', id: 'z-image-turbo', family: 'z-image' },
  { hf_id: 'krea/Krea-2-Turbo', org: 'krea', id: 'krea-2-turbo', family: 'krea' },
  { hf_id: 'Tongyi-MAI/Z-Image', org: 'tongyi-mai', id: 'z-image', family: 'z-image' },
  { hf_id: 'stabilityai/stable-diffusion-3.5-medium', org: 'stabilityai', id: 'sd-3.5-medium', family: 'stable-diffusion' },
  { hf_id: 'tencent/HunyuanImage-3.0', org: 'tencent', id: 'hunyuanimage-3.0', family: 'hunyuanimage', active_params: 13_000_000_000 },
  { hf_id: 'Qwen/Qwen-Image-2512', org: 'qwen', id: 'qwen-image-2512', family: 'qwen-image' }
]
