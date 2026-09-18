# RepoPilot 🚀

AI-powered GitHub repository analyst built on **Cloudflare Agents**, **Durable Objects**, **Cloudflare Workflows**, and **Workers AI**.

RepoPilot analyzes GitHub repositories through natural language chat and produces a structured, evidence-based engineering report covering **Architecture**, **API Design**, **Data Layer**, **Reliability**, **Observability**, **Security**, **Scalability**, and **Deployment**.

---

## 🏛️ Architecture & Primitives

RepoPilot moves beyond basic LLM chatbots by leveraging Cloudflare's core agentic and durable execution primitives:

```text
                         USER
                           |
                           v
                  +-----------------+
                  |   React / Pages |
                  |  Chat Interface |
                  +--------+--------+
                           |
                      WebSocket
                           |
                           v
                  +-----------------+
                  |    RepoAgent    |
                  |  Durable Object |
                  |  State + Chat   |
                  +--------+---------+
                           |
                     Start Workflow
                           |
                           v
              +-------------------------+
              | RepoAnalysisWorkflow    |
              |                         |
              | 1. Repository metadata  |
              | 2. Repository tree      |
              | 3. Source extraction    |
              | 4. Architecture review  |
              | 5. LLM analysis         |
              | 6. Persist report       |
              +------------+------------+
                           |
              +------------+------------+
              |                         |
              v                         v
        +-----------+             +-----------+
        | GitHub API|             | Workers AI|
        +-----------+             +-----------+
                                        |
                                        v
                                Structured Report
                                        |
                                        v
                                Agent State / SQL
                                        |
                                        v
                                     Browser
```

### 1. Agents (`RepoAgent`)
- Natural-language conversational interface.
- Parses repository requests, extracts repository URLs, maintains conversational context, and coordinates workflows.

### 2. Durable Objects
- Persists user chat history, multi-repository state, workflow executions, and approval checklists across sessions.

### 3. Workflows (`RepoAnalysisWorkflow`)
- Multi-step durable execution pipeline.
- Divided into independent steps with isolated error handling and exponential retries:
  1. `get_repository_metadata`: Gathers stars, language, default branch, description.
  2. `get_repository_tree`: Recursively explores repository file hierarchy.
  3. `select_relevant_files`: Heuristically targets high-signal manifests (`package.json`, `go.mod`, `Dockerfile`, `docker-compose.yml`, CI/CD definitions).
  4. `review_architecture`: Synthesizes service boundaries and queue configurations.
  5. `llm_reasoning`: Evaluates code artifacts against strict evidence rules.
  6. `validate_and_persist`: Enforces JSON Schema validation and commits report to durable state.

### 4. Workers AI & Gemini API
- Grounded strictly in repository evidence. Prohibits inventing unverified scale, technologies, or hypothetical deployments.

### 5. Human-in-the-Loop (HITL)
- Generates action implementation checklists from recommendations upon user approval.

### 6. Repository Comparison Mode
- Evaluates two repositories side-by-side across 6 architectural dimensions.

---

## 🚀 Benchmark Demonstration: `techmedaddy/TorrentEdge`

TorrentEdge demonstrates distributed systems analysis:
- **Event Broker**: Apache Kafka 7.5
- **Relational Storage**: PostgreSQL 16
- **In-Memory Cache**: Redis 7
- **Object Storage**: Amazon S3
- **Observability**: OpenTelemetry OTLP gRPC Collector
- **Concurrency**: Horizontal Edge Worker replicas

RepoPilot discovers this architecture dynamically from repository evidence and provides exact file citations (e.g. `deploy/docker-compose.yml:L30`, `internal/telemetry/otel.go:L13`).

---

## 📝 Transparent AI Prompt History

AI-assisted engineering prompt logs are preserved under `docs/prompts/`:
- `001-architecture.md`
- `002-agent.md`
- `003-workflow.md`
- `004-github-tools.md`
- `005-llm-analysis.md`
- `006-ui.md`
- `007-testing.md`

Users can also browse the prompt records directly inside the **CF Architecture & Prompts** tab in the application.

---

## 🛠️ Local Development & Deployment

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
