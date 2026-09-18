# Prompt 007 — Testing & Edge Cases

## Prompt
Formulate comprehensive test cases for repository analysis: invalid URLs, missing repositories, rate limits, large repositories, private repos, and schema validation.

## Generated Approach
- URL Parser validation: handles `https://github.com/owner/repo`, `github.com/owner/repo`, and short aliases `owner/repo`.
- Handles 404 / Private repo detection with actionable feedback.
- GitHub API 403 Rate Limit handling: gracefully switches to cached high-fidelity benchmark datasets or suggests providing a GitHub token.
- Resilient JSON Schema repair for LLM responses.
