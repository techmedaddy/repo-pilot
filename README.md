# RepoPilot

RepoPilot is an AI-powered GitHub repository analyst. Give it a public GitHub repository and it produces an evidence-based engineering report covering architecture, reliability, security, observability, scalability, and deployment concerns.
<img width="1915" height="985" alt="image" src="https://github.com/user-attachments/assets/cd6e0a69-6fb3-4b33-a4ae-cd7ebbfed60a" />

The repository contains two runnable implementations:

- `backend/` - the Cloudflare Workers implementation using Agents, Durable Objects, Workflows, and Workers AI.
- `repopilot-UI/` - a standalone Express and React/Vite implementation for local demos and development. It keeps state in memory and can use Gemini for analysis.

## Features

- Analyze a public GitHub repository from its URL or `owner/repository` name.
- Inspect repository metadata, the file tree, source files, manifests, and deployment configuration.
- Run a six-step analysis workflow with visible progress.
- Generate structured reports with schema-validated sections for architecture, reliability, security, observability, scalability, and recommendations.
- Ask follow-up questions about a generated report.
- Generate implementation checklists and compare repository reports.
- Start with the bundled `techmedaddy/TorrentEdge` benchmark repository.
<img width="1915" height="985" alt="image" src="https://github.com/user-attachments/assets/6ff0908f-8438-4431-8a4e-01abc1d9ff29" />


## Requirements

- Node.js 18 or newer
- npm
- A GitHub personal access token for higher GitHub API limits
- For the Cloudflare implementation: a Cloudflare account with Workers AI enabled
- For the standalone implementation: a Gemini API key if live Gemini analysis is required
<img width="1915" height="985" alt="image" src="https://github.com/user-attachments/assets/e8865e98-76d0-4d53-817a-66d234df0465" />


## Project Structure

```text
.
├── backend/
│   ├── src/server.ts                 # Cloudflare Worker entry point
│   ├── src/workflows/                # Durable repository analysis workflow
│   ├── src/components/               # Cloudflare-hosted React UI
│   ├── wrangler.jsonc                # Workers, AI, Durable Object, and Workflow bindings
│   └── package.json
├── repopilot-UI/
│   ├── server.ts                     # Standalone Express API and Vite host
│   ├── server/                       # GitHub and Gemini integrations
│   ├── src/                          # React client
│   └── package.json
└── README.md
```

## Standalone Local Development

This is the easiest way to run RepoPilot locally.

### 1. Install dependencies

```bash
cd repopilot-UI
npm install
```
<img width="1915" height="985" alt="image" src="https://github.com/user-attachments/assets/e957f8ee-3ad4-49a6-b9b1-23ae7f4eef23" />


### 2. Configure environment variables

Create `repopilot-UI/.env` and add your Gemini key:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

The committed `.env.example` is a template only. Never commit `.env` or API keys.

### 3. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If the local Vite middleware crashes on your machine, run the API-only fallback:

```bash
SKIP_VITE=true npm run dev
```

This starts the API on port `3000` without the Vite middleware. It is useful for API smoke tests, but it does not serve the React development UI.

### 4. Build and run the standalone application

```bash
npm run build
npm start
```
<img width="1915" height="985" alt="image" src="https://github.com/user-attachments/assets/93f2703a-3b01-42e8-830d-7b82f10a0bda" />


The production bundle is written to `repopilot-UI/dist/`.

## Cloudflare Development

The Cloudflare implementation lives in `backend/` and uses the bindings declared in `backend/wrangler.jsonc`.

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure local secrets

Create `backend/.dev.vars`:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

Do not commit `.dev.vars` or any file containing a real token.

### 3. Authenticate with Cloudflare

Use either interactive Wrangler login:

```bash
npx wrangler login
```

or configure a `CLOUDFLARE_API_TOKEN` in your shell for the local Workers AI binding.

### 4. Start the Worker

```bash
npm run dev
```

Wrangler will start the Worker locally and expose the configured Worker routes. Remote Workers AI bindings require Cloudflare authentication.

## Useful Commands

Run these from the relevant application directory.

### Backend

```bash
npm run check       # Format check, Oxlint, and TypeScript
npm run format      # Format source files
npm run lint        # Run Oxlint
npm run types       # Regenerate Wrangler environment types
npm run deploy      # Build and deploy to Cloudflare
```

### Standalone UI

```bash
npm run lint        # TypeScript check
npm run build       # Build the React client and API server
npm run clean       # Remove generated output
```

## API Smoke Tests

With the standalone server running on port `3000`:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/reports/techmedaddy/TorrentEdge
```

The main API routes include:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Runtime and dependency health information |
| `GET` | `/api/sample-repos` | Bundled example repositories |
| `GET` | `/api/history` | Reports held in the current process |
| `GET` | `/api/reports/:owner/:repo` | Retrieve a repository report |
| `POST` | `/api/analyze` | Start a repository analysis |
| `POST` | `/api/chat` | Ask a question about a report |
| `POST` | `/api/checklist/approve` | Approve a generated checklist |
| `POST` | `/api/checklist/toggle` | Toggle a checklist item |
| `POST` | `/api/compare` | Compare two reports |

## Notes

- The standalone server stores reports and messages in memory, so restarting it clears local state.
- GitHub repositories must be public unless the server is configured with a token that has access.
- The Cloudflare version persists agent and workflow state through Cloudflare primitives; the standalone version simulates that state locally.
- Generated files, dependencies, macOS metadata, local secrets, and the private assignment notes are excluded by the root `.gitignore`.

## License

This project is released under the MIT license. See `backend/LICENSE` for the license text.
