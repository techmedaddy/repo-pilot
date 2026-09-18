import {
  WorkflowEntrypoint,
  type WorkflowStep,
  type WorkflowEvent
} from "cloudflare:workers";
import { createWorkersAI as createAI } from "workers-ai-provider";
import { generateText as genText } from "ai";
import {
  getRepositoryMetadata,
  getRepositoryTree,
  identifyRelevantFiles,
  getFileContent
} from "../github";
import type {
  ExtractedFile,
  RepoMetadata,
  RepoTreeFile,
  StructuredReport
} from "../types";

type Env = {
  AI: any; // Workers AI binding
  GITHUB_TOKEN?: string;
};

export class RepoAnalysisWorkflow extends WorkflowEntrypoint<
  Env,
  { repoUrl: string }
> {
  async run(event: WorkflowEvent<{ repoUrl: string }>, step: WorkflowStep) {
    const { repoUrl } = event.payload;

    // Helper to parse URL
    const parseUrl = (url: string) => {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match)
        return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
      const parts = url.split("/");
      if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
      throw new Error("Invalid GitHub URL");
    };

    const { owner, repo } = parseUrl(repoUrl);
    const token = this.env.GITHUB_TOKEN;

    try {
      // Step 1: Fetch Metadata
      const metadata = await step.do("fetch-metadata", async () => {
        return await getRepositoryMetadata(owner, repo, token);
      });

      // Step 2: Fetch Tree
      const tree = await step.do("fetch-tree", async () => {
        return await getRepositoryTree(
          owner,
          repo,
          metadata.defaultBranch,
          token
        );
      });

      // Step 3: Identify and Fetch Relevant Files
      const files = await step.do("fetch-files", async () => {
        const relevantPaths = identifyRelevantFiles(tree);
        const fetched = [];
        for (const path of relevantPaths) {
          try {
            const file = await getFileContent(
              owner,
              repo,
              path,
              metadata.defaultBranch,
              token
            );
            fetched.push(file);
          } catch (_e) {
            console.warn(`Failed to fetch ${path}`);
          }
        }
        return fetched;
      });

      // Step 4: AI Analysis
      const report = await step.do("llm-analysis", async () => {
        const workersai = createAI({ binding: this.env.AI });

        const prompt = `You are a Principal Software Architect analyzing a GitHub repository.
Repository: ${metadata.fullName}
Description: ${metadata.description}
Language: ${metadata.language}
Topics: ${metadata.topics.join(", ")}

Here are the key architectural files discovered:
${files.map((f) => `--- FILE: ${f.path} ---\n${f.contentSnippet}\n---`).join("\n\n")}

Analyze the repository and respond with ONLY a valid JSON object (no markdown, no explanation, no code fences) with these exact keys:
{
  "summary": "2-3 sentence summary of the repo",
  "techStack": ["technology1", "technology2"],
  "architecturePattern": "e.g. Microservices, Monolith",
  "architectureOverview": "brief overview of system design",
  "components": ["component1", "component2"],
  "securityFindings": ["finding1 or empty array"],
  "scalabilityNotes": "notes on scalability",
  "recommendations": ["recommendation1"],
  "uncertainties": ["things not determinable from code"]
}

IMPORTANT: Output ONLY the JSON object. No other text.`;

        try {
          const { text } = await genText({
            model: workersai("@cf/meta/llama-3.1-8b-instruct-fast"),
            prompt: prompt
          });

          // Extract JSON from response
          let jsonStr = text.trim();
          // Remove markdown code fences if present
          const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }
          // Try to find JSON object boundaries
          const startIdx = jsonStr.indexOf("{");
          const endIdx = jsonStr.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.slice(startIdx, endIdx + 1);
          }

          // Attempt to repair truncated JSON
          let parsed;
          try {
            parsed = JSON.parse(jsonStr);
          } catch {
            // Try to fix common LLM JSON issues: unterminated strings, trailing commas
            let repaired = jsonStr;
            // Close any unclosed strings by appending a quote
            const quoteCount = (repaired.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) repaired += '"';
            // Close unclosed arrays
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            for (let i = 0; i < openBrackets - closeBrackets; i++)
              repaired += "]";
            // Close unclosed objects
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
            // Remove trailing commas before } or ]
            repaired = repaired.replace(/,\s*([}\]])/g, "$1");
            parsed = JSON.parse(repaired);
          }

          return buildReport(metadata, tree, files, parsed);
        } catch (err: any) {
          return buildReport(metadata, tree, files, {
            summary: `Workers AI analysis could not complete, so RepoPilot generated a deterministic evidence-based report. Error: ${err.message}`,
            architecturePattern: "Repository Evidence Review",
            architectureOverview:
              "RepoPilot inspected repository metadata, tree entries, and selected high-signal files to produce a conservative report.",
            recommendations: [
              "Review the selected manifest, deployment, and entrypoint files for architecture-specific follow-up."
            ],
            uncertainties: ["Workers AI did not return a usable JSON analysis."]
          });
        }
      });

      return report;
    } catch (err: any) {
      const fallbackMetadata: RepoMetadata = {
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        description:
          "Repository analysis could not complete; fallback report generated from the submitted repository URL.",
        language: "Unknown",
        stars: 0,
        forks: 0,
        openIssues: 0,
        defaultBranch: "main",
        topics: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: `https://github.com/${owner}/${repo}`
      };

      return buildReport(fallbackMetadata, [], [], {
        summary: `RepoPilot could not complete the live workflow for ${owner}/${repo}. Error: ${err.message}`,
        architecturePattern: "Incomplete Analysis",
        architectureOverview:
          "The workflow returned a structured fallback report so the user can see the failure and retry with corrected credentials or repository access.",
        recommendations: [
          "Check repository visibility, GitHub API rate limits, Cloudflare Workers AI access, and workflow logs before retrying."
        ],
        uncertainties: [`Workflow failure: ${err.message}`]
      });
    }
  }
}

function buildReport(
  metadata: RepoMetadata,
  tree: RepoTreeFile[],
  files: ExtractedFile[],
  llm: Partial<{
    summary: string;
    techStack: string[];
    architecturePattern: string;
    architectureOverview: string;
    components: string[];
    securityFindings: string[];
    scalabilityNotes: string;
    recommendations: string[];
    uncertainties: string[];
  }>
): StructuredReport {
  const paths = tree.map((item) => item.path);
  const snippets = files
    .map((file) => file.contentSnippet.toLowerCase())
    .join("\n");
  const hasDocker = paths.some((path) => /docker|compose/i.test(path));
  const hasCi = paths.some((path) => path.startsWith(".github/workflows"));
  const hasPackageJson = paths.includes("package.json");
  const hasGoMod = paths.includes("go.mod");
  const hasPython = paths.some((path) =>
    /requirements\.txt|pyproject\.toml/i.test(path)
  );
  const hasRedis =
    snippets.includes("redis") || paths.some((path) => /redis/i.test(path));
  const hasPostgres =
    snippets.includes("postgres") ||
    snippets.includes("pgx") ||
    paths.some((path) => /postgres/i.test(path));
  const hasKafka =
    snippets.includes("kafka") || paths.some((path) => /kafka/i.test(path));
  const hasOtel =
    snippets.includes("opentelemetry") ||
    snippets.includes("otel") ||
    paths.some((path) => /otel/i.test(path));

  const techStack = [
    {
      category: "Primary Language",
      name: metadata.language || "Unknown",
      evidence: "GitHub repository metadata"
    },
    ...(hasPackageJson
      ? [
          {
            category: "Runtime",
            name: "Node.js / JavaScript",
            evidence: "package.json"
          }
        ]
      : []),
    ...(hasGoMod
      ? [{ category: "Runtime", name: "Go", evidence: "go.mod" }]
      : []),
    ...(hasPython
      ? [
          {
            category: "Runtime",
            name: "Python",
            evidence: "requirements.txt or pyproject.toml"
          }
        ]
      : []),
    ...(hasKafka
      ? [
          {
            category: "Messaging",
            name: "Apache Kafka",
            evidence: "repository tree or selected files"
          }
        ]
      : []),
    ...(hasPostgres
      ? [
          {
            category: "Database",
            name: "PostgreSQL",
            evidence: "repository tree or selected files"
          }
        ]
      : []),
    ...(hasRedis
      ? [
          {
            category: "Cache",
            name: "Redis",
            evidence: "repository tree or selected files"
          }
        ]
      : []),
    ...(hasOtel
      ? [
          {
            category: "Observability",
            name: "OpenTelemetry",
            evidence: "repository tree or selected files"
          }
        ]
      : []),
    ...(hasDocker
      ? [
          {
            category: "Deployment",
            name: "Docker",
            evidence: "Dockerfile or docker-compose file"
          }
        ]
      : []),
    ...(hasCi
      ? [
          {
            category: "CI/CD",
            name: "GitHub Actions",
            evidence: ".github/workflows/*"
          }
        ]
      : [])
  ];

  const componentNames =
    llm.components && llm.components.length > 0
      ? llm.components
      : files.map((file) => file.path);

  const recommendationText =
    llm.recommendations && llm.recommendations.length > 0
      ? llm.recommendations
      : [
          "Add explicit architecture documentation and operational runbooks for the discovered components."
        ];

  const securityText = llm.securityFindings || [];

  return {
    id: `rep-${Date.now()}`,
    repoUrl: metadata.htmlUrl,
    owner: metadata.owner,
    repoName: metadata.name,
    analyzedAt: new Date().toISOString(),
    summary:
      llm.summary ||
      `${metadata.fullName} was analyzed from repository metadata, file tree, and selected source/configuration files. Findings are limited to evidence visible in the repository.`,
    techStack,
    architecture: {
      pattern: llm.architecturePattern || "Evidence-Based Repository Review",
      overview:
        llm.architectureOverview ||
        "The repository structure and selected files indicate the main application boundaries, dependencies, and deployment surfaces. RepoPilot avoids asserting runtime topology beyond the inspected evidence.",
      components: componentNames.slice(0, 8).map((name, index) => ({
        name,
        role:
          index === 0 ? "Primary inspected artifact" : "Repository component",
        technology: metadata.language || "Unknown",
        evidence: files[index]?.path || "Repository tree"
      })),
      dataFlow: [
        "User submits a GitHub repository URL.",
        "RepoPilot fetches repository metadata and tree information.",
        "RepoPilot selects high-signal files and generates an evidence-based report."
      ],
      asciiDiagram:
        "User -> RepoPilot Agent -> RepoAnalysisWorkflow -> GitHub API\n" +
        "                                      |\n" +
        "                                      v\n" +
        "                              Workers AI Analysis"
    },
    apiDesign: {
      protocol: paths.some((path) => /api|route|controller|handler/i.test(path))
        ? "HTTP/API layer observed in repository paths"
        : "No API protocol conclusively observed",
      endpointsObserved: paths
        .filter((path) => /api|route|controller|handler/i.test(path))
        .slice(0, 6),
      validation:
        "Validation strategy requires deeper file inspection unless visible in selected files.",
      errorHandling:
        "Error handling requires deeper file inspection unless visible in selected files.",
      evidence: files.map((file) => file.path).join(", ") || "Repository tree"
    },
    dataLayer: {
      primaryStorage: hasPostgres
        ? "PostgreSQL observed"
        : "No primary database conclusively observed",
      caching: hasRedis ? "Redis observed" : "No cache conclusively observed",
      persistenceModel:
        "Inferred only from repository evidence; runtime persistence was not assumed.",
      evidence: files.map((file) => file.path).join(", ") || "Repository tree"
    },
    reliability: {
      idempotency:
        "No explicit idempotency guarantees were confirmed from the selected evidence.",
      retriesAndBackoff:
        "Retry/backoff behavior was not conclusively identified from the selected evidence.",
      failureHandling:
        "Failure handling requires deeper inspection of application control flow.",
      evidence: files.map((file) => file.path).join(", ") || "Repository tree"
    },
    observability: {
      logging: "Logging was not conclusively assessed from selected evidence.",
      metrics: "Metrics were not conclusively assessed from selected evidence.",
      tracing: hasOtel
        ? "OpenTelemetry evidence observed"
        : "Tracing not conclusively observed",
      healthChecks:
        "Health checks were not conclusively identified from selected evidence.",
      evidence: files.map((file) => file.path).join(", ") || "Repository tree"
    },
    security: {
      authentication:
        "Authentication/authorization was not assumed without direct evidence.",
      secretHandling:
        "Secret handling should be reviewed in configuration and deployment files.",
      inputValidation:
        "Input validation was not conclusively assessed from selected evidence.",
      vulnerabilitiesIdentified: securityText.map((finding, index) => ({
        id: `sec-${index + 1}`,
        category: "Security",
        severity: "medium",
        evidence: files[index]?.path || "Workers AI finding",
        explanation: finding,
        recommendation:
          "Verify the finding against source code and add tests or configuration hardening as needed."
      }))
    },
    scalability: {
      model:
        llm.scalabilityNotes ||
        "Scalability model was not assumed beyond repository evidence.",
      bottlenecks: [
        "Large repositories may require broader file sampling and incremental analysis."
      ],
      queueingObserved: hasKafka
        ? "Kafka evidence observed"
        : "No queueing system conclusively observed",
      evidence: files.map((file) => file.path).join(", ") || "Repository tree"
    },
    deployment: {
      containers: hasDocker
        ? "Docker evidence observed"
        : "No container configuration conclusively observed",
      ciCd: hasCi
        ? "GitHub Actions evidence observed"
        : "No CI/CD workflow conclusively observed",
      orchestration:
        "Container orchestration was not assumed without direct evidence.",
      evidence:
        paths
          .filter((path) => /docker|compose|workflow|k8s|helm/i.test(path))
          .join(", ") || "Repository tree"
    },
    recommendations: recommendationText.map((recommendation, index) => ({
      id: `rec-${index + 1}`,
      category: "Architecture",
      severity: index === 0 ? "medium" : "low",
      evidence: files[index]?.path || "Repository evidence",
      explanation: recommendation,
      recommendation
    })),
    uncertainties: llm.uncertainties || [
      "Only selected repository files were inspected.",
      "Runtime deployment and production scale were not assumed."
    ]
  };
}
