# Prompt 001 — Architecture

## Prompt
Design the high-level architecture for RepoPilot, an AI-powered GitHub repository analyst built with Cloudflare Agent and Workflow primitives. How should the conversational interface, Durable Objects, Workflows, GitHub API tools, and Workers AI / LLM connect to avoid inventing unverified architecture?

## Generated Approach
The system separates runtime concerns:
1. **Frontend / Pages**: React SPA with live WebSocket/SSE streaming for workflow progress, chat, and interactive structured reports.
2. **RepoAgent (Durable Object)**: Maintains conversational session state, user preferences, and connects incoming user prompts to repository execution triggers.
3. **RepoAnalysisWorkflow (Durable Multi-step Workflow)**: Deconstructs repository inspection into 6 discrete, resilient steps:
   - Metadata retrieval
   - Tree navigation
   - Config and source snippet extraction
   - Structural mapping
   - LLM analysis on concrete evidence
   - Schema validation and report persistence
4. **Workers AI / Gemini Server-side**: Receives parsed repository artifacts with a strict evidence-based system prompt prohibiting hallucinations.

## Changes Made
- Introduced human-in-the-loop (HITL) approval steps for checklist generation.
- Added side-by-side repository comparison workflow.
- Enforced strict JSON Schema validation before emitting reports to clients.

## Manual Decisions
- Chose an interactive visual workflow stepper rather than an opaque loading spinner to give complete visibility into token consumption and step durations.
- Pre-indexed high-fidelity evidence for the benchmark repository `techmedaddy/TorrentEdge` (Kafka, PostgreSQL, Redis, S3, OTel) to allow deterministic testing and resilience when GitHub API rate limits are encountered.
