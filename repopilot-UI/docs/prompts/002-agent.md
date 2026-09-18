# Prompt 002 — Agent & Durable State

## Prompt
Implement the conversational RepoAgent runtime that identifies GitHub repository URLs from natural language queries, manages conversational context, and invokes the durable analysis workflow.

## Generated Approach
- Parse natural language for GitHub URLs matching `github.com/:owner/:repo`.
- Support contextual follow-ups ("What are the security risks?", "Compare this to my previous repo").
- Maintain message histories and active repository context in durable state.

## Changes Made
- Added intent detection for direct repository URLs, comparison requests, question answering, and checklist generation.
- Added state tracking linking user conversations to multiple analyzed repositories.

## Manual Decisions
- Added instant 1-click sample repositories (`techmedaddy/TorrentEdge`, `expressjs/express`, `fastapi/fastapi`, `supabase/supabase`) for zero-friction evaluation.
