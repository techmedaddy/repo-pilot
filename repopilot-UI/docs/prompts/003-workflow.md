# Prompt 003 — Workflow

## Prompt
Structure the durable multi-step repository analysis workflow in Cloudflare Workflows. Ensure each step is isolated and reports granular progress back to the user interface.

## Generated Approach
- Step 1: `fetch_metadata` — basic repository statistics, primary language, topics.
- Step 2: `fetch_tree` — full recursive repository tree index.
- Step 3: `select_files` — heuristic selection of manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`), container configs (`Dockerfile`, `docker-compose.yml`), CI/CD (`.github/workflows/*`), and entry points.
- Step 4: `review_structure` — topological mapping of service boundaries.
- Step 5: `llm_analysis` — structured prompt with strict constraints.
- Step 6: `validate_and_persist` — schema validation and report persistence.

## Changes Made
- Added duration tracking for each step.
- Implemented step status streaming (`pending` -> `running` -> `completed` / `failed`).

## Manual Decisions
- Retries configured with exponential backoff on network failures.
