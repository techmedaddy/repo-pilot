# Prompt 004 — GitHub Tools

## Prompt
Specify and implement the targeted GitHub extraction tools: `get_repository_metadata`, `get_repository_tree`, and `get_file`. Why avoid dumping the entire repo into the prompt?

## Generated Approach
- Full codebase dumping exhausts token windows and triggers hallucinations on tangential files.
- High-value architectural signals reside in specific files: manifests, Dockerfiles, compose specs, CI definitions, and entry points.
- Implement tools that fetch only targeted files based on tree heuristics.

## Changes Made
- Added file size caps (max 128KB per extracted file) to prevent memory bloating.
- Added base64/UTF-8 decoding with fallback for raw binary assets.
- Added offline cache for demonstration repositories when GitHub public API rate limits (60 req/hr) are reached.

## Manual Decisions
- Built an intelligent categorizer distinguishing package manifests, CI/CD, database schemas, API routes, and background workers.
