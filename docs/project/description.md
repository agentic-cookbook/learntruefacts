# Learn True Facts

A free AI improv comedian chat app that blends real historical facts with absurdly plausible fictional details.

## Purpose

Learn True Facts is a public-facing chat application featuring an AI improv comedian persona. It serves as a test bed for a modern tech stack (Cloudflare + Railway) and persona-driven AI applications before scaling to production use with Temporal. Currently in the design and research phase with no application code committed yet.

## Key Features (Planned)

- AI chat interface with improv comedian persona
- Multi-provider LLM abstraction (Cloudflare Workers AI, Google Gemini, Groq, Claude)
- Server-Sent Events for real-time streaming responses
- Admin portal and analytics dashboard
- RS256 JWT authentication via shared agenticauthservice

## Tech Stack (Planned)

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + TanStack Router/Query
- **Backend:** Hono + Drizzle ORM + PostgreSQL + Zod
- **Infrastructure:** Cloudflare Workers (frontend), Railway (backend)
- **Auth:** RS256 JWT via agenticauthservice
- **Domain:** learntruefacts.com

## Status

Planning / pre-implementation (design and research phase).

## Related Projects

- [Agentic Auth Service](../../agenticauthservice/docs/project/description.md) — shared authentication service
- [MyAgenticProjects](../../myagenticprojects/docs/project/description.md) — similar tech stack (Hono + React + Railway + Cloudflare)
