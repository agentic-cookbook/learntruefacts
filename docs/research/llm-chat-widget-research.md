# LLM Chat Widget Research
*"Chat with Mike" — terminal-style widget for a personal website*

---

## Cost Estimate: Anthropic API at Scale

**Model:** Claude Haiku 4.5 (cheapest current production model)
**Pricing:** $1 / MTok input · $5 / MTok output

### Per Conversation (10 back-and-forths = 20 messages)

| Item | Tokens |
|---|---|
| System prompt | ~200 |
| Avg user message | ~50 |
| Avg Claude response | ~150 |
| Accumulated history (avg over 10 turns) | ~600 |
| **Total input per conversation** | **~6,000** |
| **Total output per conversation** | **~1,500** |

**Cost per conversation: ~$0.013** (about 1.3 cents)

### At 1 Million Uses

| Scenario | Estimated Cost |
|---|---|
| Standard pricing | ~$13,000 |
| With prompt caching (~70% input savings) | ~$7,500 |
| With Batch API (50% off, async only) | ~$6,500 |
| Both optimizations stacked | ~$4,000–5,000 |

> **Note:** Batch API requires async/24hr processing — not suitable for real-time chat.
> Prompt caching is the key lever for a live chat widget (system prompt cached after first call).

---

## Free / Open Source LLM Options

### Free API Tiers (No Self-Hosting)

**Google Gemini API** ⭐ Best free tier
- Gemini 2.0 Flash — genuinely capable, fast
- Free limits: 15 req/min · 1,500 req/day · 1M tokens/day
- More than sufficient for a personal site

**Groq**
- Runs open models (Llama 3, Gemma, Mixtral) on their own hardware
- Exceptional inference speed — great feel in a terminal widget
- Generous free tier with reasonable rate limits

**OpenRouter**
- Aggregates many models, some free with rate limits
- Good fallback/routing option

**Cloudflare Workers AI** ⭐ Best fit given existing stack
- Llama 3, Mistral, and others running on Cloudflare's edge
- Free tier included
- Runs *inside* a Cloudflare Worker — no separate backend needed
- Zero new infrastructure if already on Cloudflare

### Open Source Models (Self-Hosted)

| Model | Notes |
|---|---|
| **Meta Llama 3.x** | Gold standard · 8B/70B/405B · Commercially usable |
| **Mistral / Mixtral** | Apache 2.0 license · Punches above its weight |
| **Google Gemma 2/3** | 2B/9B/27B · Solid quality |
| **Qwen 2.5 (Alibaba)** | Surprisingly competitive at chat |
| **DeepSeek V3/R1** | Exceptional quality · Open weights |

### Self-Hosting Tools

- **Ollama** — Easiest path. One-line install, OpenAI-compatible local API. Mac Studio M2 Ultra (64GB) handles 70B models comfortably.
- **LM Studio** — GUI-based, great for experimenting
- **vLLM** — Production-grade serving for Linux/cloud GPU deployments

---

## Recommended Architecture: Free Tier

Given existing Railway + Cloudflare infrastructure:

```
Browser (terminal widget)
    ↓
Cloudflare Worker (free)
    ↓
Cloudflare Workers AI  ←  Llama 3.1 8B on CF's edge
```

- Zero new infrastructure
- Zero cost
- ~30 lines of Worker code
- Deploy with `wrangler deploy`

**Fallback:** If model quality isn't sufficient, swap the Worker to call **Gemini free tier** — same architecture, different API call.

---

## Paid Architecture (When the Time Comes 🤑)

```
Browser (terminal widget)
    ↓ SSE stream
Railway API server (Node/Bun)  ←  ANTHROPIC_API_KEY lives here
    ↓
Anthropic API (Haiku 4.5 → Sonnet → Opus)
```

Cloudflare sits in front for DDoS protection. Never call the Anthropic API directly from the browser — API key exposure.

### Key Backend Concerns

- **Rate limiting** — per-IP limits (e.g. 10 messages/min) to prevent abuse
- **Hard spend cap** — set in Anthropic console (~$50/month to start)
- **Streaming** — use SSE (`text/event-stream`) for the terminal typewriter effect
- **Prompt caching** — cache the system prompt to cut input costs ~70%

---

## Quality Tradeoff

| | Free (Llama/Gemini) | Haiku 4.5 | Sonnet 4.6 | Opus 4.6 |
|---|---|---|---|---|
| Simple Q&A / persona chat | ✅ Fine | ✅ Good | ✅ Great | ✅ Best |
| Nuanced / complex responses | ⚠️ Drifts | ✅ Good | ✅ Great | ✅ Best |
| Cost | Free | ~$0.013/convo | ~$0.05/convo | ~$0.10/convo |
| Ops burden | Medium–High | None | None | None |

Free models are capable for a conversational persona widget — a tight, well-crafted system prompt is the most important quality lever regardless of model.

---

## Self-Hosting Economics at Scale

"Free" model weights ≠ free at 1M conversations. At scale you need cloud GPUs:

- **Providers:** Lambda Labs, RunPod, Vast.ai
- **Typical cost:** $1–4/hr for an A100
- **Estimated cost at 1M conversations:** $2,000–6,000 (potentially cheaper than Haiku, but with real ops overhead)
- **Break-even point:** Self-hosting makes economic sense somewhere north of $5–10K/month in API spend

---

## Model Pricing Reference (April 2026)

| Model | Input / MTok | Output / MTok |
|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Opus 4.6 | $5.00 | $25.00 |
| Gemini 2.0 Flash | Free (rate limited) | Free |
| Llama 3.x via Groq | Free (rate limited) | Free |

> Haiku 3 ($0.25/$1.25) is deprecated and retires April 19, 2026.

---

*Research compiled April 2026*
