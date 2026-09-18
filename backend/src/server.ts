import { createWorkersAI } from "workers-ai-provider";
import { callable, routeAgentRequest, type Schedule } from "agents";
import { getSchedulePrompt, scheduleSchema } from "agents/schedule";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import {
  convertToModelMessages,
  pruneMessages,
  stepCountIs,
  streamText,
  tool
} from "ai";
import { z } from "zod";

import { getGithubTools } from "./tools/githubTools";
export { RepoAnalysisWorkflow } from "./workflows/repo-analysis";

export interface Env {
  AI: any;
  GITHUB_TOKEN?: string;
  REPO_ANALYSIS_WORKFLOW: any;
  RepoAgent: DurableObjectNamespace<RepoAgent>;
}

function workflowSteps(status: string) {
  const done = status === "complete" || status === "completed";
  const failed =
    status === "errored" || status === "failed" || status === "error";
  return [
    "Fetch Metadata",
    "Inspect Tree",
    "Extract Source",
    "LLM Reasoning",
    "Validate Report",
    "Persist Report"
  ].map((label, index) => ({
    id: `step-${index + 1}`,
    label,
    description:
      index === 0
        ? "Retrieve repository metadata"
        : index === 1
          ? "Inspect repository file tree"
          : index === 2
            ? "Select and fetch relevant evidence files"
            : index === 3
              ? "Analyze evidence with Workers AI"
              : index === 4
                ? "Normalize structured report output"
                : "Return report to the application",
    status: done
      ? "completed"
      : failed
        ? "failed"
        : index === 0
          ? "running"
          : "pending"
  }));
}

export class RepoAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 100;
  chatRecovery = true;
  // Wait for MCP connections to be re-established after hibernation before
  // processing a message, so MCP tools aren't intermittently missing.
  waitForMcpConnections = true;

  onStart() {
    // Configure OAuth popup behavior for MCP servers that require authentication
    this.mcp.configureOAuthCallback({
      customHandler: (result) => {
        if (result.authSuccess) {
          return new Response("<script>window.close();</script>", {
            headers: { "content-type": "text/html" },
            status: 200
          });
        }
        return new Response(
          `Authentication Failed: ${result.authError || "Unknown error"}`,
          { headers: { "content-type": "text/plain" }, status: 400 }
        );
      }
    });
  }

  @callable()
  async addServer(name: string, url: string) {
    return await this.addMcpServer(name, url);
  }

  @callable()
  async removeServer(serverId: string) {
    await this.removeMcpServer(serverId);
  }

  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    const mcpTools = this.mcp.getAITools();
    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/moonshotai/kimi-k2.7-code", {
        sessionAffinity: this.sessionAffinity
      }),
      system: `You are RepoPilot, a highly capable software architecture analyst. You help users understand GitHub repositories.
If the user asks to analyze a repository, ALWAYS use the \`analyzeRepository\` tool to start the deep background analysis workflow.
You can also use the GitHub tools to fetch metadata, read specific files, or browse the repository tree to answer questions about the codebase.

${getSchedulePrompt({ date: new Date() })}`,
      // Prune old tool calls and reasoning to save tokens on long conversations
      messages: pruneMessages({
        messages: await convertToModelMessages(this.messages),
        toolCalls: "before-last-2-messages",
        reasoning: "before-last-message"
      }),
      tools: {
        ...mcpTools,
        ...getGithubTools(this.env.GITHUB_TOKEN),

        analyzeRepository: tool({
          description:
            "Trigger a comprehensive background analysis of a GitHub repository. Use this whenever the user asks to analyze a repository.",
          inputSchema: z.object({
            repoUrl: z
              .string()
              .describe(
                "The URL or owner/name of the GitHub repository to analyze"
              )
          }),
          execute: async ({ repoUrl }) => {
            try {
              const instance = await this.env.REPO_ANALYSIS_WORKFLOW.create({
                params: { repoUrl }
              });

              // Broadcast that the analysis started
              this.broadcast(
                JSON.stringify({
                  type: "workflow-started",
                  workflowId: instance.id,
                  repoUrl
                })
              );

              return `Started analysis workflow for ${repoUrl}. The workflow ID is ${instance.id}. You will be notified when it completes.`;
            } catch (error: any) {
              return `Error starting analysis workflow: ${error.message}`;
            }
          }
        }),

        // Server-side tool: runs automatically on the server
        getWeather: tool({
          description: "Get the current weather for a city",
          inputSchema: z.object({
            city: z.string().describe("City name")
          }),
          execute: async ({ city }) => {
            // Replace with a real weather API in production
            const conditions = ["sunny", "cloudy", "rainy", "snowy"];
            const temp = Math.floor(Math.random() * 30) + 5;
            return {
              city,
              temperature: temp,
              condition:
                conditions[Math.floor(Math.random() * conditions.length)],
              unit: "celsius"
            };
          }
        }),

        // Client-side tool: no execute function — the browser handles it
        getUserTimezone: tool({
          description:
            "Get the user's timezone from their browser. Use this when you need to know the user's local time.",
          inputSchema: z.object({})
        }),

        // Approval tool: requires user confirmation before executing
        calculate: tool({
          description:
            "Perform a math calculation with two numbers. Requires user approval for large numbers.",
          inputSchema: z.object({
            a: z.number().describe("First number"),
            b: z.number().describe("Second number"),
            operator: z
              .enum(["+", "-", "*", "/", "%"])
              .describe("Arithmetic operator")
          }),
          needsApproval: async ({ a, b }) =>
            Math.abs(a) > 1000 || Math.abs(b) > 1000,
          execute: async ({ a, b, operator }) => {
            const ops: Record<string, (x: number, y: number) => number> = {
              "+": (x, y) => x + y,
              "-": (x, y) => x - y,
              "*": (x, y) => x * y,
              "/": (x, y) => x / y,
              "%": (x, y) => x % y
            };
            if (operator === "/" && b === 0) {
              return { error: "Division by zero" };
            }
            return {
              expression: `${a} ${operator} ${b}`,
              result: ops[operator](a, b)
            };
          }
        }),

        scheduleTask: tool({
          description:
            "Schedule a task to be executed at a later time. Use this when the user asks to be reminded or wants something done later.",
          inputSchema: scheduleSchema,
          execute: async ({ when, description }) => {
            if (when.type === "no-schedule") {
              return "Not a valid schedule input";
            }
            const input =
              when.type === "scheduled"
                ? when.date
                : when.type === "delayed"
                  ? when.delayInSeconds
                  : when.type === "cron"
                    ? when.cron
                    : null;
            if (!input) return "Invalid schedule type";
            try {
              this.schedule(input, "executeTask", description, {
                idempotent: true
              });
              return `Task scheduled: "${description}" (${when.type}: ${input})`;
            } catch (error) {
              return `Error scheduling task: ${error}`;
            }
          }
        }),

        getScheduledTasks: tool({
          description: "List all tasks that have been scheduled",
          inputSchema: z.object({}),
          execute: async () => {
            const tasks = this.getSchedules();
            return tasks.length > 0 ? tasks : "No scheduled tasks found.";
          }
        }),

        cancelScheduledTask: tool({
          description: "Cancel a scheduled task by its ID",
          inputSchema: z.object({
            taskId: z.string().describe("The ID of the task to cancel")
          }),
          execute: async ({ taskId }) => {
            try {
              this.cancelSchedule(taskId);
              return `Task ${taskId} cancelled.`;
            } catch (error) {
              return `Error cancelling task: ${error}`;
            }
          }
        })
      },
      stopWhen: stepCountIs(20),
      abortSignal: options?.abortSignal
    });

    return result.toUIMessageStreamResponse();
  }

  async executeTask(description: string, _task: Schedule<string>) {
    // Do the actual work here (send email, call API, etc.)
    console.log(`Executing scheduled task: ${description}`);

    // Notify connected clients via a broadcast event.
    // We use broadcast() instead of saveMessages() to avoid injecting
    // into chat history — that would cause the AI to see the notification
    // as new context and potentially loop.
    this.broadcast(
      JSON.stringify({
        type: "scheduled-task",
        description,
        timestamp: new Date().toISOString()
      })
    );
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ hasGeminiKey: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname.startsWith("/api/reports/")) {
      // Return a dummy/empty report for now to satisfy initial load, or implement fetch from KV/D1
      return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      const { repoUrl } = (await request.json()) as any;
      try {
        const instance = await env.REPO_ANALYSIS_WORKFLOW.create({
          params: { repoUrl }
        });

        return new Response(
          JSON.stringify({
            workflow: {
              id: instance.id,
              repoUrl,
              status: "running",
              currentStepIndex: 0,
              startedAt: new Date().toISOString(),
              steps: [
                {
                  id: "1",
                  label: "Started",
                  status: "running",
                  description: "Workflow started"
                }
              ]
            },
            report: null,
            agentMessage: {
              id: `msg-${Date.now()}`,
              sender: "agent",
              content: `Started analysis workflow for ${repoUrl}. The workflow ID is ${instance.id}.`,
              timestamp: new Date().toISOString()
            }
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname.startsWith("/api/workflows/")) {
      const id = url.pathname.split("/").pop();
      try {
        const instance = await env.REPO_ANALYSIS_WORKFLOW.get(id!);
        const status = await instance.status();

        let report = null;
        if (status.status === "complete" || status.status === "completed") {
          report = (status as any).output || (status as any).result || null;
        }

        return new Response(
          JSON.stringify({
            workflow: {
              id: instance.id,
              status: status.status,
              steps: workflowSteps(status.status)
            },
            report
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const { message } = (await request.json()) as any;
      // We can do a lightweight LLM call or regex to check if user wants to analyze a repo
      const analyzeMatch = message.match(
        /(?:analyze|review) (https:\/\/github\.com\/[^\s]+|[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/i
      );

      if (analyzeMatch) {
        const repoUrl = analyzeMatch[1];
        return new Response(
          JSON.stringify({
            reply: {
              id: `msg-${Date.now()}`,
              sender: "agent",
              content: `I'll start an analysis of ${repoUrl} for you right away.`,
              timestamp: new Date().toISOString()
            },
            actionRequired: "trigger_analysis",
            repoUrl
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          reply: {
            id: `msg-${Date.now()}`,
            sender: "agent",
            content: `You said: "${message}". I am ready to analyze a repository for you!`,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Let routeAgentRequest handle agent DO endpoints if any
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    return new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
