# RepoPilot

RepoPilot is an AI repository analyst built on **Cloudflare Agent** and **Workflow** primitives. It analyzes public GitHub repositories to generate evidence-based engineering reports covering:

- Architecture & Data Flow
- Reliability & Idempotency
- Security & Secret Handling
- OpenTelemetry Observability
- Scalability Bottlenecks

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Cloudflare Workers, Cloudflare Durable Objects, Cloudflare Workflows, Hono/Agent routing
- **AI Integration**: Workers AI (`@cf/moonshotai/kimi-k2.7-code` and `@cf/meta/llama-3.1-8b-instruct`), Vercel AI SDK
- **Language**: TypeScript

## System Architecture

1. **RepoAgent (Durable Object)**: Manages chat sessions, context persistence, and intent parsing. It leverages `@cloudflare/ai-chat` to maintain state.
2. **RepoAnalysisWorkflow (Cloudflare Workflows)**: A highly resilient background pipeline that executes a 4-step sequence:
   - `fetch-metadata`: Interrogates the GitHub API for repo statistics.
   - `fetch-tree`: Indexes the repository tree recursively.
   - `fetch-files`: Downloads specific manifests (e.g., `package.json`, `docker-compose.yml`).
   - `llm-analysis`: Runs the evidence through an LLM to generate a strictly typed (`Zod` validated) JSON report.
3. **REST API**: Custom Worker endpoints (`/api/chat`, `/api/analyze`, `/api/workflows/:id`) bridge the React frontend with the Cloudflare backend primitives, streaming progress efficiently.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)
- A GitHub Personal Access Token (for increased rate limits)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Add your GitHub token to the `.dev.vars` file for local development:
   ```bash
   echo "GITHUB_TOKEN=your_token_here" > .dev.vars
   ```

3. Start the local development server:
   ```bash
   npx wrangler dev
   ```

## Deployment

Deploying the application to Cloudflare's edge network:

1. Log in to Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Add your GitHub token to the production secrets:
   ```bash
   npx wrangler secret put GITHUB_TOKEN
   ```

3. Deploy the application:
   ```bash
   npm run deploy
   ```
   *(This will run `vite build` followed by `wrangler deploy`)*

## Prompt History

During development, the following major AI prompt paradigms were used:
- **Agent Intent Parsing Prompt:** "You are RepoPilot, a highly capable software architecture analyst. If the user asks to analyze a repository, ALWAYS use the `analyzeRepository` tool to start the deep background analysis workflow."
- **Workflow Analysis Prompt:** "You are an expert software architect. Analyze the provided repository structure and evidence. Extract the core architecture, scalability bottlenecks, and security vulnerabilities. Respond ONLY in valid JSON matching the exact schema."

## Edge Cases Handled

- **Missing `data.report` payload**: Cloudflare Workflows are executed asynchronously. To handle this, the React frontend (`App.tsx`) implements an intelligent polling mechanism. It gracefully queries the `/api/workflows/:id` endpoint every 2 seconds to check the state (`running`, `completed`, or `failed`), preventing UI crashes and rendering intermediate loading states.
- **Strict TypeScript Validation**: Fixed generic `unknown` HTTP response types from the Fetch API by enforcing explicit interface casts and schema validations (`StructuredReportSchema`), passing full `tsc --noEmit` checks.
