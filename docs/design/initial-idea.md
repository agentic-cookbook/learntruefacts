# Learn True Facts — Initial Design

*"Facts are true... or are they?"*

## The Idea

**Learn True Facts** is a free, public-facing chat app where users converse with an AI improv comedian persona that makes up hilariously plausible-sounding "facts." The persona weaves real details with absurd inventions — swapping in unlikely celebrities, adding fake follow-up consequences, and delivering it all with deadpan confidence.

This is a **test app** for our technology stack (Cloudflare + Railway + shared auth + agent registry) before we scale it to production use with Temporal. It also serves as our first user-facing AI persona, stress-testing content safety, model abstraction, and conversation recording.

---

## Core Experience

### The Persona: Improv Fact Comedian

The AI acts as a confident, deadpan improv comedian who presents "true facts" that blend:

- **Real events with absurd character swaps** — e.g., Carrot Top as the first moonwalker, President Randall D. Mantooth
- **True details extended with fictional consequences** — e.g., the bicycle horn honk, Buzz Aldrin's snort laugh startling ground control
- **Plausible-sounding nonsense delivered with authority** — scientific-sounding explanations, specific dates and numbers, attributed quotes
- **Layered humor** — some jokes are obvious, others require knowledge of the real facts to catch

The persona will be fully designed using our [persona template](../../official-agent-registry/docs/research/ai-persona-template.md) and registered in the [Official Agent Registry](../../officialagentregistry) with name, avatar, backstory, and personality traits.

### The Interface

A **terminal-style chat transcript** — retro, clean, and focused on the conversation. No flashy UI; the humor is the product.

- Each conversation gets a **session ID**
- All conversations are **recorded on the backend**
- Streaming responses with typewriter effect (SSE)

---

## Content Safety — Non-Negotiable

This app must be **absolutely safe for children**. The following guardrails are required at both the prompt and application level:

### Prompt-Level Guards
- System prompt explicitly forbids: sexual content, profanity, slurs, violence, drug references, hate speech, politically divisive content, bullying, self-harm references
- Persona is instructed to deflect inappropriate user requests in-character (humor, not lectures)
- Topic boundaries: humor stays in the realm of history, science, pop culture, animals, food, geography — nothing edgy

### Application-Level Guards
- Input filtering: reject messages containing known-bad content before they reach the LLM
- Output filtering: scan responses before displaying to the user
- Rate limiting per IP/session to prevent abuse
- Conversation logging for audit/review
- Content moderation review capability in admin dashboard

### Test Harness (Red Team)
A dedicated test harness that tries to break the persona:
- Attempts to elicit profanity, sexual content, offensive material
- Tries prompt injection and jailbreak techniques
- Tests boundary-pushing topics
- Automated + manual test suites
- Results tracked and used to harden the system prompt

---

## Model Strategy

### Abstraction Layer
The backend abstracts the LLM provider so models can be swapped per-user without changing the chat interface. Key design:

- **Unified chat interface** — same API shape regardless of provider
- **Provider adapters** — each LLM provider (Cloudflare Workers AI, Google Gemini, Anthropic, Groq, OpenRouter) gets an adapter
- **Model selection per user** — stored in user preferences or session config
- **System prompt reuse** — same persona prompt across all models, with provider-specific formatting if needed

### Model Tiers

| Tier | Models | Who Gets It |
|------|--------|-------------|
| **Free (anonymous)** | Cloudflare Workers AI (Llama 3.1 8B), Google Gemini Flash, Groq (Llama/Mixtral) | Everyone |
| **Free (logged in)** | All free models + model switching UI | Users with accounts |
| **Premium (future)** | Claude Haiku/Sonnet/Opus | Logged-in users (owner/admin initially, paid tier TBD) |

### Cost Reference
From our [LLM research](../research/llm-chat-widget-research.md):
- Free models: $0/conversation (rate-limited)
- Claude Haiku: ~$0.013/conversation
- Claude Sonnet: ~$0.05/conversation
- Prompt caching reduces input costs ~70%

---

## Architecture

### Stack (per site-manager conventions)

| Component | Technology | Hosting |
|-----------|-----------|---------|
| **Main site** | React 19 + Vite + Tailwind 4 + TanStack Router/Query | Cloudflare Workers (`learntruefacts.com`) |
| **Backend API** | Hono + Drizzle ORM + PostgreSQL + Zod | Railway |
| **Admin site** | React 19 + Vite + Tailwind 4 | Cloudflare Workers (`admin.learntruefacts.com`) |
| **Dashboard** | React 19 + Vite + Tailwind 4 + D1 SQLite | Cloudflare Workers (`dashboard.learntruefacts.com`) |
| **Auth** | Shared auth service (RS256 JWT) | Railway (via `agentic-auth-service`) |
| **Streaming** | SSE (`text/event-stream`) | Railway → Browser |

### Data Model (key tables)

- **conversations** — session_id, user_id (nullable for anonymous), model_used, created_at, metadata
- **messages** — conversation_id, role (user/assistant/system), content, token_count, created_at
- **users** — linked to shared auth service (GitHub, Google, Apple, email/pw+2FA)
- **shared_conversations** — conversation_id, share_token, created_at, expires_at

### Auth Integration
Uses the [agentic-auth-service](../../agentic-auth-service):
- RS256 JWT validation via `/.well-known/jwks.json`
- Supports: email/password (with 2FA), GitHub OAuth, Google OAuth, Apple Sign-In (to be added)
- Anonymous users get full chat access, just can't save/share conversations
- Logged-in users get conversation history, sharing, and model selection

### API Endpoints (initial)

```
POST   /api/chat                    — Send message, get streamed response
GET    /api/conversations           — List user's conversations (auth required)
GET    /api/conversations/:id       — Get conversation transcript
POST   /api/conversations/:id/share — Generate share link
GET    /api/shared/:token           — View shared conversation (public)
GET    /api/models                  — List available models for current user
PUT    /api/preferences/model       — Set preferred model (auth required)
```

---

## Agent Registry Integration

The "Learn True Facts" persona will be registered in the Official Agent Registry:

- **Slug:** `learn-true-facts` (at `officialagentregistry.com/learn-true-facts`)
- **Display Name:** TBD (the comedian character's name)
- **Description:** Improv comedian AI that teaches you "true facts" — combining real events with absurd fiction
- **Config (JSONB):** Full persona definition — backstory, personality traits, voice, constraints, sample interactions
- **Public:** Yes

---

## Test Harness

### Purpose
Automated adversarial testing to ensure the persona stays in character and within content safety bounds.

### Test Categories
1. **Character consistency** — Does it stay in the improv comedian role?
2. **Content safety** — Can it be tricked into inappropriate content?
3. **Prompt injection** — Can the system prompt be overridden or leaked?
4. **Topic boundaries** — Does it handle sensitive topics gracefully?
5. **Model comparison** — Do all supported models maintain the same guardrails?

### Implementation
- Script-based test runner that fires adversarial prompts at the chat API
- Each test has: input prompt, expected behavior (pass/fail criteria), severity level
- Results logged to a report with pass/fail/flagged status
- Run against each supported model to compare guardrail effectiveness
- Integrated into CI/CD — safety regression tests before deploy

---

## Rollout Plan (High Level)

### Phase 1: MVP
- Terminal chat UI with single free model (Cloudflare Workers AI)
- Backend with conversation recording
- Basic content safety (prompt + input filtering)
- Anonymous-only (no auth yet)

### Phase 2: Multi-Model + Auth
- Model abstraction layer with 2-3 free providers
- Shared auth integration (login, conversation history, sharing)
- Model switching UI for logged-in users

### Phase 3: Safety Hardening
- Full test harness (automated red team)
- Output filtering layer
- Admin dashboard for conversation review
- Content moderation tooling

### Phase 4: Premium + Registry
- Premium model tier (Claude) for authorized users
- Persona registered in Official Agent Registry
- Public sharing with social preview cards

---

## Open Questions

- [ ] What should the comedian persona's name be? (needs to be registered in the agent registry)
- [ ] Domain: do we have `learntruefacts.com`? Check domain portfolio
- [ ] Paid tier pricing and gating mechanism — circle back later
- [ ] Apple Sign-In support in auth service — is it planned?
- [ ] Should anonymous conversations have a TTL before deletion?
- [ ] Rate limits: what's appropriate for free anonymous users?
- [ ] Should the test harness be a separate service or part of the admin tooling?

---

*Design started April 7, 2026*
