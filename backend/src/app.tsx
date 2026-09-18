import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { WorkflowProgress } from "./components/WorkflowProgress";
import { ChatInterface } from "./components/ChatInterface";
import { ReportView } from "./components/ReportView";
import { ComparisonView } from "./components/ComparisonView";
import { ArchitectureView } from "./components/ArchitectureView";
import type {
  StructuredReport,
  WorkflowExecution,
  ChatMessage,
  RepoComparison
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "chat" | "report" | "compare" | "architecture"
  >("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [currentReport, setCurrentReport] = useState<StructuredReport | null>(
    null
  );
  const [allReports, setAllReports] = useState<StructuredReport[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Initial Load: Fetch health and benchmark report
  useEffect(() => {
    async function init() {
      try {
        const healthRes = await fetch("/api/health");
        if (healthRes.ok) {
          const healthData: any = await healthRes.json();
          setHasGeminiKey(healthData.hasGeminiKey);
        }

        // Fetch TorrentEdge benchmark report
        const reportRes = await fetch("/api/reports/techmedaddy/TorrentEdge");
        if (reportRes.ok) {
          const rep: any = await reportRes.json();
          setCurrentReport(rep);
          setAllReports([rep]);
        }

        // Set initial welcome message
        setMessages([
          {
            id: "msg-init",
            sender: "agent",
            content: `👋 Welcome to **RepoPilot**, an AI repository analyst built on Cloudflare Agent and Workflow primitives.\n\nI can analyze any public GitHub repository (e.g. \`https://github.com/techmedaddy/TorrentEdge\`) and generate an evidence-based engineering report covering:\n• **Architecture & Data Flow**\n• **Reliability & Idempotency**\n• **Security & Secret Handling**\n• **OpenTelemetry Observability**\n• **Scalability Bottlenecks**\n• **Prioritized Recommendations with file citations**\n\nEnter a repository URL above or choose a quick demonstration preset to run the durable workflow.`,
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // Run Durable Workflow Analysis
  const handleAnalyzeRepo = async (repoUrl: string) => {
    setIsAnalyzing(true);
    setErrorBanner(null);
    setCurrentReport(null);

    // Initial placeholder workflow to show immediate UI feedback
    setWorkflow({
      id: `wf-${Date.now()}`,
      repoUrl,
      status: "running",
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      steps: [
        {
          id: "step-1",
          label: "Fetch Metadata",
          description: "Querying repository stats, stars, default branch...",
          status: "running"
        },
        {
          id: "step-2",
          label: "Inspect Tree",
          description: "Recursive repository file indexing...",
          status: "pending"
        },
        {
          id: "step-3",
          label: "Extract Source",
          description: "Targeting manifests and Docker compose files...",
          status: "pending"
        },
        {
          id: "step-4",
          label: "Topological Review",
          description: "Mapping component boundaries...",
          status: "pending"
        },
        {
          id: "step-5",
          label: "LLM Reasoning",
          description: "Evaluating evidence with strict constraints...",
          status: "pending"
        },
        {
          id: "step-6",
          label: "Persist Report",
          description: "Schema validation and commit to Durable Object...",
          status: "pending"
        }
      ]
    });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl })
      });

      const data: any = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Repository analysis failed");
      }

      setWorkflow(data.workflow);

      if (data.report) {
        setCurrentReport(data.report);
        setAllReports((prev) => {
          const filtered = prev.filter(
            (r) =>
              r.id !== data.report.id && r.repoName !== data.report.repoName
          );
          return [...filtered, data.report];
        });
        setIsAnalyzing(false);
      } else {
        // Poll for workflow status
        const workflowId = data.workflow.id;
        let isDone = false;

        while (!isDone) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          try {
            const statusRes = await fetch(`/api/workflows/${workflowId}`);
            if (statusRes.ok) {
              const statusData: any = await statusRes.json();

              if (statusData.workflow) {
                setWorkflow((prev) =>
                  prev ? { ...prev, ...statusData.workflow } : null
                );
              }

              if (
                [
                  "complete",
                  "completed",
                  "failed",
                  "errored",
                  "error"
                ].includes(statusData.workflow?.status)
              ) {
                isDone = true;
                if (statusData.report) {
                  setCurrentReport(statusData.report);
                  setAllReports((prev) => {
                    const filtered = prev.filter(
                      (r) =>
                        r.id !== statusData.report.id &&
                        r.repoName !== statusData.report.repoName
                    );
                    return [...filtered, statusData.report];
                  });
                } else if (
                  statusData.workflow?.status === "errored" ||
                  statusData.workflow?.status === "failed"
                ) {
                  setErrorBanner(
                    `Workflow execution failed on Cloudflare backend.`
                  );
                }
                setIsAnalyzing(false);
              }
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }
      }

      // Add agent reply to chat
      if (data.agentMessage) {
        setMessages((prev) => [...prev, data.agentMessage]);
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorBanner(err.message || "Failed to analyze repository");
      if (workflow) {
        setWorkflow((prev) =>
          prev ? { ...prev, status: "failed", error: err.message } : null
        );
      }
      setIsAnalyzing(false);
    }
  };

  // Send message to Agent
  const handleSendMessage = async (text: string) => {
    setIsReplying(true);
    setErrorBanner(null);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          currentRepoId: currentReport?.id
        })
      });

      const data: any = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process message");
      }

      // If user pasted a repo URL or requested repo analysis
      if (data.actionRequired === "trigger_analysis" && data.repoUrl) {
        const triggerMsg: ChatMessage = {
          id: `msg-agent-${Date.now()}`,
          sender: "agent",
          content: data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, triggerMsg]);
        handleAnalyzeRepo(data.repoUrl);
        return;
      }

      if (data.reply) {
        setMessages((prev) => [...prev, data.reply]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "agent",
        content: `Error: ${err.message || "Unable to complete request"}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsReplying(false);
    }
  };

  // Approve Human-in-the-Loop checklist
  const handleApproveChecklist = async (reportId: string, hitlId: string) => {
    try {
      const res = await fetch("/api/checklist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: reportId || currentReport?.id,
          hitlId,
          decision: "approved"
        })
      });

      const data: any = await res.json();
      if (res.ok && data.message) {
        // Update the message in state to mark hitlPrompt as approved
        setMessages((prev) =>
          prev.map((m) => {
            if (m.hitlPrompt && m.hitlPrompt.id === hitlId) {
              return {
                ...m,
                hitlPrompt: { ...m.hitlPrompt, status: "approved" as const },
                checklist: data.checklist
              };
            }
            return m;
          })
        );
      }
    } catch (err) {
      console.error("HITL approval error:", err);
    }
  };

  // Reject Human-in-the-Loop checklist
  const handleRejectChecklist = async (reportId: string, hitlId: string) => {
    try {
      const res = await fetch("/api/checklist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: reportId || currentReport?.id,
          hitlId,
          decision: "rejected"
        })
      });

      const data: any = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.hitlPrompt && m.hitlPrompt.id === hitlId) {
              return {
                ...m,
                hitlPrompt: { ...m.hitlPrompt, status: "rejected" as const }
              };
            }
            return m;
          })
        );
      }
    } catch (err) {
      console.error("HITL rejection error:", err);
    }
  };

  // Toggle checklist task done state
  const handleToggleChecklistItem = async (
    checklistId: string,
    itemId: string,
    done: boolean
  ) => {
    // Update locally first for instant tactile response
    setMessages((prev) =>
      prev.map((m) => {
        if (m.checklist && m.checklist.id === checklistId) {
          return {
            ...m,
            checklist: {
              ...m.checklist,
              items: m.checklist.items.map((item) =>
                item.id === itemId ? { ...item, done } : item
              )
            }
          };
        }
        return m;
      })
    );

    try {
      await fetch("/api/checklist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistId, itemId, done })
      });
    } catch (err) {
      console.error("Failed to toggle checklist item on server:", err);
    }
  };

  // Trigger Comparison between two repos
  const handleTriggerCompare = async (
    repoAId: string,
    repoBId: string
  ): Promise<RepoComparison | null> => {
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoAId, repoBId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Comparison error:", err);
    }
    return null;
  };

  const handleViewReport = (reportId?: string) => {
    if (reportId) {
      const found = allReports.find((r) => r.id === reportId);
      if (found) setCurrentReport(found);
    }
    setActiveTab("report");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRepoName={
          currentReport
            ? `${currentReport.owner}/${currentReport.repoName}`
            : undefined
        }
        hasGeminiKey={hasGeminiKey}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Error Notification Banner if any */}
        {errorBanner && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-red-400 hover:text-red-200 font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Workflow Progress Stepper (Visible during or after active analysis) */}
        {workflow && (
          <WorkflowProgress
            workflow={workflow}
            onViewReport={() => setActiveTab("report")}
          />
        )}

        {/* Tab 1: Agent Chat & Workflow Submissions */}
        {activeTab === "chat" && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onAnalyzeRepo={handleAnalyzeRepo}
            onApproveChecklist={handleApproveChecklist}
            onRejectChecklist={handleRejectChecklist}
            onToggleChecklistItem={handleToggleChecklistItem}
            onViewReport={handleViewReport}
            isAnalyzing={isAnalyzing}
            isReplying={isReplying}
          />
        )}

        {/* Tab 2: Structured Engineering Report */}
        {activeTab === "report" && (
          <ReportView report={currentReport} onSelectRepo={handleAnalyzeRepo} />
        )}

        {/* Tab 3: Repository Comparison */}
        {activeTab === "compare" && (
          <ComparisonView
            reports={allReports}
            onTriggerCompare={handleTriggerCompare}
            onAnalyzeRepo={handleAnalyzeRepo}
          />
        )}

        {/* Tab 4: Cloudflare Architecture & AI Prompts Audit */}
        {activeTab === "architecture" && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            RepoPilot &copy; 2026 — Built on Cloudflare Agent and Workflow
            Primitives
          </span>
          <div className="flex items-center gap-3">
            <span className="text-zinc-600">Workers AI / Gemini 3.8</span>
            <span>•</span>
            <span className="text-zinc-600">Durable Objects State</span>
            <span>•</span>
            <span className="text-zinc-600">Evidence-Based Reasoning</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
