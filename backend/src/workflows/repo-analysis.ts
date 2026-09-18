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

        const result = parsed;
        return {
          id: `rep-${Date.now()}`,
          repoUrl: metadata.htmlUrl,
          owner: metadata.owner,
          repoName: metadata.name,
          analyzedAt: new Date().toISOString(),
          summary: result.summary || "Analysis complete.",
          techStack: result.techStack || [],
          architecturePattern: result.architecturePattern || "Unknown",
          architectureOverview: result.architectureOverview || "",
          components: result.components || [],
          securityFindings: result.securityFindings || [],
          scalabilityNotes: result.scalabilityNotes || "",
          recommendations: result.recommendations || [],
          uncertainties: result.uncertainties || []
        };
      } catch (err: any) {
        return {
          id: `rep-error-${Date.now()}`,
          repoUrl: metadata.htmlUrl,
          owner: metadata.owner,
          repoName: metadata.name,
          analyzedAt: new Date().toISOString(),
          summary: `LLM analysis failed: ${err.message}`,
          techStack: [],
          architecturePattern: "Unknown",
          architectureOverview: "Could not be determined due to LLM error.",
          components: [],
          securityFindings: [],
          scalabilityNotes: "Not analyzed.",
          recommendations: [`Fix LLM error: ${err.message}`],
          uncertainties: ["Full analysis could not be completed."]
        };
      }
    });

    return report;
  }
}
