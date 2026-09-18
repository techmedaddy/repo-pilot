# RepoPilot

AI-powered GitHub repository analyst built on Cloudflare Agents.

## Overview

RepoPilot is a conversational AI application that analyzes GitHub
repositories and produces a structured engineering report covering
architecture, reliability, security, observability, scalability, and
deployment.

The application is designed around Cloudflare's Agent and Workflow
primitives rather than a simple request → LLM → response architecture.

## Problem

Understanding an unfamiliar repository usually requires manually
inspecting the repository tree, configuration files, dependencies, APIs,
background workers, databases, deployment configuration, and
observability setup.

RepoPilot automates this initial analysis through a conversational
interface.

A user can provide a GitHub repository URL such as:

``` text
https://github.com/techmedaddy/TorrentEdge
```

RepoPilot fetches relevant repository information, analyzes the
codebase, and returns a structured engineering report.

## Goals

-   Analyze GitHub repositories through natural-language chat.
-   Inspect repository metadata, structure, dependencies, and relevant
    source files.
-   Use an LLM to reason over repository evidence.
-   Execute analysis through a durable multi-step workflow.
-   Persist conversation and analysis state.
-   Stream workflow progress to the user.
-   Produce structured, evidence-based reports.
-   Avoid inventing architecture or technologies that are not present in
    the repository.

## Architecture

``` text
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
                  |    RepoAgent     |
                  |                  |
                  | Durable Object   |
                  | State + Chat     |
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
        | GitHub API|             | Workers AI |
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

## Cloudflare Components

### Agents

The Agent is the conversational runtime.

Responsibilities:

-   Receive user messages.
-   Identify repository-analysis requests.
-   Extract the GitHub repository URL.
-   Start the repository analysis workflow.
-   Maintain conversational state.
-   Return workflow results to the user.
-   Stream progress to connected clients.

### Durable Objects

The Agent uses Durable Objects for durable per-agent state and real-time
communication.

State can include:

-   Conversation history.
-   Previously analyzed repositories.
-   Analysis status.
-   Report references.
-   User preferences.

### Workflows

The repository analysis runs as a durable workflow.

The workflow is intentionally divided into independent steps so
individual failures can be retried without restarting the entire
analysis.

Proposed workflow:

``` text
Repository URL
      |
      v
Fetch metadata
      |
      v
Fetch repository tree
      |
      v
Select relevant files
      |
      v
Analyze repository structure
      |
      v
Generate LLM analysis
      |
      v
Validate structured output
      |
      v
Persist report
```

### Workers AI

Workers AI provides the LLM used for repository analysis.

The model should receive repository evidence rather than an unsupported
summary.

The prompt should explicitly instruct the model not to invent
technologies, architecture, scale, deployment, or operational
characteristics.

### Pages / Frontend

The frontend provides:

-   Chat interface.
-   Repository URL input.
-   Live workflow progress.
-   Structured analysis report.
-   Previous analysis history.

## GitHub Tools

The Agent/Workflow should expose focused GitHub operations instead of
sending an entire repository to the model.

Proposed tools:

### `get_repository_metadata`

Returns:

-   Repository name.
-   Description.
-   Primary language.
-   Repository topics.
-   Default branch.
-   Basic repository metadata.

### `get_repository_tree`

Returns the repository file structure.

This allows the system to identify:

-   Backend directories.
-   Frontend directories.
-   Configuration files.
-   Docker files.
-   CI/CD configuration.
-   Infrastructure files.
-   Tests.
-   Documentation.

### `get_file`

Retrieves the contents of a selected repository file.

Relevant examples:

-   `package.json`
-   `pyproject.toml`
-   `requirements.txt`
-   `Dockerfile`
-   `docker-compose.yml`
-   CI/CD configuration
-   application entry points
-   API modules
-   worker modules
-   database configuration

## Repository Analysis

The analysis should cover:

### Architecture

-   Application components.
-   Service boundaries.
-   API layer.
-   Worker/background processing.
-   Data flow.
-   External integrations.

### API Design

-   REST/gRPC usage where applicable.
-   Request/response structure.
-   Validation.
-   Error handling.
-   Service boundaries.

### Data Layer

-   Databases.
-   Caching.
-   Persistence model.
-   Data access patterns.

### Reliability

-   Idempotency.
-   Retries.
-   Recovery.
-   Failure handling.
-   State management.

### Observability

-   Logging.
-   Metrics.
-   Distributed tracing.
-   Health checks.

### Security

-   Input validation.
-   Authentication/authorization where visible.
-   Secret handling.
-   Dependency/security concerns.
-   Unsafe parsing or processing patterns.

### Scalability

-   Synchronous vs asynchronous processing.
-   Queues.
-   Worker architecture.
-   Stateful components.
-   Potential bottlenecks.

### Deployment

-   Docker.
-   CI/CD.
-   Cloud configuration.
-   Infrastructure-as-code.
-   Container orchestration.

## Structured LLM Output

The LLM should return structured data similar to:

``` json
{
  "summary": "...",
  "architecture": "...",
  "api_design": [],
  "data_layer": [],
  "reliability": [],
  "observability": [],
  "security": [],
  "scalability": [],
  "deployment": [],
  "recommendations": []
}
```

Each issue should contain:

``` json
{
  "severity": "medium",
  "evidence": "...",
  "explanation": "...",
  "recommendation": "..."
}
```

The output should be schema-validated before being shown to the user.

## Evidence-Based Analysis

RepoPilot should follow these rules:

1.  Do not invent technologies.
2.  Do not assume production deployment.
3.  Do not claim scale that cannot be established from repository
    evidence.
4.  Distinguish observed implementation from recommendations.
5.  Include file-level evidence where possible.
6.  Clearly identify uncertainty.
7.  Prefer concrete technical observations over generic AI-generated
    statements.

## Memory and State

RepoPilot should remember previous analyses.

Example:

``` text
User:
Analyze TorrentEdge.

RepoPilot:
Analysis completed.

User:
Compare this with my previous repository.

RepoPilot:
Using the previous repository analysis...
```

The state should maintain a relationship between:

``` text
User
 |
 +-- Conversation
 |
 +-- Repository A
 |     |
 |     +-- Analysis
 |
 +-- Repository B
       |
       +-- Analysis
```

## Live Progress

The UI should show meaningful workflow progress instead of a generic
loading indicator.

Example:

``` text
Analyzing repository...

✓ Repository discovered
✓ Repository metadata retrieved
✓ Repository structure inspected
✓ Relevant source files selected
⟳ Generating architecture analysis
○ Validating report
○ Saving report
```

When the workflow completes:

``` text
✓ Analysis complete
```

## Example User Flow

### 1. User submits repository

``` text
Analyze https://github.com/techmedaddy/TorrentEdge
```

### 2. Agent identifies the task

``` text
Repository analysis requested.
```

### 3. Workflow starts

``` text
Fetching repository...
```

### 4. GitHub tools collect evidence

``` text
Repository metadata
Repository tree
Relevant source files
Infrastructure configuration
```

### 5. LLM analyzes evidence

The model evaluates:

``` text
Architecture
Reliability
Security
Observability
Scalability
Deployment
```

### 6. Structured report is generated

``` text
Architecture
-------------
REST control plane
    |
    v
Kafka
    |
    v
Asynchronous workers
    |
    +--> PostgreSQL
    +--> Redis
    +--> S3

Reliability
-----------
- Idempotency
- Retries
- Recovery

Observability
-------------
- OpenTelemetry

Recommendations
---------------
...
```

## Example Repository

TorrentEdge is a suitable demonstration repository because it is a
distributed artifact platform using technologies such as Kafka,
PostgreSQL, Redis, S3, and OpenTelemetry.

The demo should use the repository as input evidence and allow RepoPilot
to discover its architecture rather than hard-coding the expected
answer.

## Optional Agentic Feature

Add a repository comparison mode:

``` text
Compare:
https://github.com/repo-a
vs
https://github.com/repo-b
```

Workflow:

``` text
Repository A
     |
     v
Analysis A
     |
     +----------------+
                      |
                      v
                Comparison
                      ^
     +----------------+
     |
     v
Analysis B
     ^
     |
Repository B
```

The final output can compare:

-   Architecture.
-   Reliability.
-   Observability.
-   Security.
-   Scalability.
-   Deployment.

## Optional Human-in-the-Loop Feature

Allow the user to approve an action generated from the analysis.

Example:

``` text
RepoPilot identified 7 recommended improvements.

Generate an implementation checklist?

[Approve] [Reject]
```

The agent pauses until the user provides approval.

## Project Structure

``` text
repo-pilot/
├── src/
│   ├── agents/
│   │   └── RepoAgent.ts
│   ├── workflows/
│   │   └── RepoAnalysisWorkflow.ts
│   ├── tools/
│   │   ├── github.ts
│   │   └── repository.ts
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── Progress.tsx
│   │   └── Report.tsx
│   └── worker.ts
├── public/
├── docs/
│   └── prompts/
├── wrangler.jsonc
├── package.json
└── README.md
```

## Implementation Plan

### Phase 1 --- Cloudflare Agent

Start from the Cloudflare Agents starter and get the default chat
application running.

### Phase 2 --- Repository Input

Add GitHub URL parsing and validation.

### Phase 3 --- GitHub Integration

Implement repository metadata, tree, and file retrieval.

### Phase 4 --- Durable Workflow

Move repository analysis into a multi-step Cloudflare Workflow.

### Phase 5 --- Workers AI

Add LLM-based analysis using repository evidence.

### Phase 6 --- Structured Output

Add schema validation for the generated report.

### Phase 7 --- State

Persist conversation and repository analysis state.

### Phase 8 --- Progress

Stream workflow status to the frontend.

### Phase 9 --- UI

Render the final analysis as structured sections rather than plain text.

### Phase 10 --- Deployment

Deploy the application to Cloudflare and document the deployment
process.

### Phase 11 --- Testing

Test:

-   Invalid GitHub URLs.
-   Missing repositories.
-   Private repositories.
-   Large repositories.
-   Missing files.
-   GitHub API failures.
-   LLM failures.
-   Invalid LLM output.
-   Workflow retries.
-   Duplicate workflow execution.
-   Interrupted execution.

## Prompt History

AI-assisted development is part of the assignment, so maintain a
transparent prompt history.

Recommended structure:

``` text
docs/
└── prompts/
    ├── 001-architecture.md
    ├── 002-agent.md
    ├── 003-workflow.md
    ├── 004-github-tools.md
    ├── 005-llm-analysis.md
    ├── 006-ui.md
    └── 007-testing.md
```

Each prompt record should contain:

``` markdown
# Prompt 003 — Workflow

## Prompt

[Original prompt]

## Generated Approach

[Relevant output]

## Changes Made

[What was kept or modified]

## Manual Decisions

[Why changes were made]
```

This makes it clear which parts were AI-assisted and which engineering
decisions were made manually.

## Definition of Done

RepoPilot is complete when:

-   [ ] User can start a conversation.
-   [ ] User can provide a GitHub repository URL.
-   [ ] Agent validates and understands the request.
-   [ ] Agent starts a Cloudflare Workflow.
-   [ ] Workflow retrieves repository evidence.
-   [ ] Workflow uses Workers AI for analysis.
-   [ ] LLM output is schema validated.
-   [ ] Analysis state is persisted.
-   [ ] Workflow progress is visible in the UI.
-   [ ] Final report is rendered clearly.
-   [ ] Failures are handled and retried appropriately.
-   [ ] Application is deployed on Cloudflare.
-   [ ] README documents architecture and setup.
-   [ ] AI prompt history is included.

## Why This Project

RepoPilot demonstrates the core requirements of the Cloudflare
assignment without reducing the project to a basic chatbot.

It combines:

-   LLM inference.
-   Agent runtime.
-   Durable state.
-   Durable workflows.
-   Tool calling.
-   GitHub API integration.
-   Structured outputs.
-   Real-time progress.
-   Backend architecture.
-   Reliability and failure handling.

It also provides a technically relevant demonstration domain for backend
and infrastructure engineering.
link 1- https://agents.cloudflare.com/
link 2- https://developers.cloudflare.com/agents/