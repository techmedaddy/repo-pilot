export interface PromptDoc {
  id: string;
  number: string;
  title: string;
  prompt: string;
  generatedApproach: string;
  changesMade: string;
  manualDecisions: string;
}

export const PROMPTS_HISTORY: PromptDoc[] = [
  {
    id: "001",
    number: "001",
    title: "Architecture & Primitives",
    prompt:
      "Design the high-level architecture for RepoPilot, an AI-powered GitHub repository analyst built with Cloudflare Agent and Workflow primitives. How should the conversational interface, Durable Objects, Workflows, GitHub API tools, and Workers AI / LLM connect to avoid inventing unverified architecture?",
    generatedApproach:
      "Separated runtime concerns into RepoAgent (Durable Object for session and state), RepoAnalysisWorkflow (durable multi-step execution pipeline), GitHub tools, and server-side LLM inference with evidence enforcement.",
    changesMade:
      "Added human-in-the-loop (HITL) approval step, side-by-side repository comparison, and strict evidence verification.",
    manualDecisions:
      "Enforced step-by-step progress streaming and pre-indexed benchmark ground-truth for techmedaddy/TorrentEdge to guarantee zero-failure live demos."
  },
  {
    id: "002",
    number: "002",
    title: "Agent & Durable State",
    prompt:
      "Implement the conversational RepoAgent runtime that identifies GitHub repository URLs from natural language queries, manages conversational context, and invokes the durable analysis workflow.",
    generatedApproach:
      "Natural language intent classifier extracting GitHub URLs, tracking multi-repo context, and answering in-depth technical questions grounded in the generated analysis.",
    changesMade:
      "Equipped the agent with memory of previous analyses to support 'Compare with my previous repo' and 'Explain the reliability findings'.",
    manualDecisions:
      "Added interactive sample repositories for zero-friction testing."
  },
  {
    id: "003",
    number: "003",
    title: "Durable Workflow",
    prompt:
      "Structure the durable multi-step repository analysis workflow in Cloudflare Workflows. Ensure each step is isolated and reports granular progress back to the user interface.",
    generatedApproach:
      "6-step discrete workflow: Metadata -> Tree Index -> File Extraction -> Structural Mapping -> LLM Inference -> Schema Validation & Persistence.",
    changesMade:
      "Granular status streaming (pending, running, completed, duration in milliseconds, files inspected count).",
    manualDecisions: "Isolated step failures with exponential retry policies."
  },
  {
    id: "004",
    number: "004",
    title: "GitHub Tools",
    prompt:
      "Specify and implement targeted GitHub extraction tools: get_repository_metadata, get_repository_tree, and get_file. Why avoid dumping the entire repo into the prompt?",
    generatedApproach:
      "Heuristic targeting: extract manifests (package.json, pyproject.toml, go.mod), Dockerfiles, docker-compose, CI/CD (.github/workflows), and entry point controllers instead of entire codebases.",
    changesMade:
      "Added 128KB file size guardrails and automated rate-limit fallbacks.",
    manualDecisions:
      "Built categorical classification for backend, frontend, database, worker, and infrastructure files."
  },
  {
    id: "005",
    number: "005",
    title: "LLM Analysis & Evidence Rules",
    prompt:
      "Design the system prompt and structured schema for the repository analysis LLM. How do we enforce evidence-based findings and avoid inventing unverified architecture?",
    generatedApproach:
      "Strict negative constraints: DO NOT invent technologies, DO NOT assume unverified production scale, require a concrete 'evidence' file reference for every finding, and flag assumptions in uncertainties.",
    changesMade:
      "Server-side integration with @google/genai using gemini-3.8-flash and resilient structured JSON schemas.",
    manualDecisions:
      "Engineered severity levels (critical, high, medium, low) paired with specific file references and remediations."
  },
  {
    id: "006",
    number: "006",
    title: "User Interface",
    prompt:
      "Design an engineer-grade dashboard for RepoPilot featuring chat, live workflow execution steps, structured evidence-based reports, comparison mode, and human-in-the-loop approvals.",
    generatedApproach:
      "High-contrast developer theme with Plus Jakarta Sans and Fira Code, interactive architecture diagrams, tabbed deep dives, and live step progress indicators.",
    changesMade:
      "Added interactive checklist approvals with toggleable task states and export to Markdown/JSON.",
    manualDecisions:
      "Emphasized scannability, clear component relationships, and direct file-path badges."
  },
  {
    id: "007",
    number: "007",
    title: "Testing & Edge Cases",
    prompt:
      "Formulate comprehensive test cases for repository analysis: invalid URLs, missing repositories, rate limits, large repositories, private repos, and schema validation.",
    generatedApproach:
      "Test matrix validating URL variations, 404/403 responses, oversized repositories, and schema recovery.",
    changesMade:
      "Added instant fallback diagnostics and rate limit recovery notifications.",
    manualDecisions:
      "Pre-loaded high-fidelity verified evidence for techmedaddy/TorrentEdge."
  }
];

export const CLOUDFLARE_ARCHITECTURE_SPEC = {
  title: "Cloudflare Agents & Workflows Architecture",
  description:
    "How RepoPilot maps conversational AI and durable execution to Cloudflare infrastructure primitives:",
  primitives: [
    {
      name: "RepoAgent",
      type: "Cloudflare Agent / Durable Object",
      role: "Conversational Runtime & Durable State",
      details:
        "Maintains persistent WebSocket connections, tracks multi-turn chat history, user preferences, and connects conversation intents to workflow executions."
    },
    {
      name: "RepoAnalysisWorkflow",
      type: "Cloudflare Workflows",
      role: "Durable Multi-Step Pipeline",
      details:
        "Step-by-step resilient execution: 1. Metadata -> 2. Repository Tree -> 3. Source Extraction -> 4. Architecture Review -> 5. Workers AI Reasoning -> 6. Schema Validation & Persistence. Each step is durable and independently retried on transient failures."
    },
    {
      name: "Workers AI / Gemini API",
      type: "LLM Inference Engine",
      role: "Evidence-Based Technical Reasoning",
      details:
        "Evaluates extracted source files against strict constraints: forbids hallucinating scale or unobserved tools, extracts concrete line evidence, and generates structured JSON."
    },
    {
      name: "GitHub Tool Layer",
      type: "Durable Worker Tools",
      role: "Targeted Codebase Inspection",
      details:
        "Exposes get_repository_metadata, get_repository_tree, and get_file with smart file heuristic selection, keeping token costs minimal while maximizing signal."
    },
    {
      name: "D1 / Durable Object Storage",
      type: "Storage & Persistence",
      role: "Report & Checklists Registry",
      details:
        "Persists structured analysis reports, implementation checklists, and historical metrics for instant cross-repository comparisons."
    }
  ]
};
