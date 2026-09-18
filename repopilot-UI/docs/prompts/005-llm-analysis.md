# Prompt 005 — LLM Analysis & Evidence Rules

## Prompt
Design the system prompt and structured schema for the repository analysis LLM. How do we enforce evidence-based findings and avoid inventing unverified architecture?

## Generated Approach
- Define strict negative constraints:
  - DO NOT invent technologies not directly visible in manifests or code.
  - DO NOT assume unverified production scale.
  - Require a concrete `evidence` file reference (e.g. `docker-compose.yml:L14` or `package.json`) for every component and issue.
  - Flag any assumptions in an explicit `uncertainties` array.
- Structure JSON output with Typed schemas covering Architecture, API Design, Data Layer, Reliability, Observability, Security, Scalability, Deployment, and Recommendations.

## Changes Made
- Integrated `@google/genai` using model `gemini-3.8-flash` with fallback to high-fidelity rule-based heuristic extraction if API keys are unprovided.
- Strict schema validation ensuring every issue has `severity`, `evidence`, `explanation`, and `recommendation`.
