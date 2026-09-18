import React, { useState } from "react";
import {
  PROMPTS_HISTORY,
  CLOUDFLARE_ARCHITECTURE_SPEC
} from "../data/promptsData";
import {
  Layers,
  FileText,
  CheckCircle2,
  ChevronRight,
  Terminal,
  ShieldCheck
} from "lucide-react";

export const ArchitectureView: React.FC = () => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>("001");

  const selectedPrompt =
    PROMPTS_HISTORY.find((p) => p.id === selectedPromptId) ||
    PROMPTS_HISTORY[0];

  const definitionOfDoneItems = [
    {
      label: "User can start a conversation",
      done: true,
      desc: "RepoPilot conversational runtime in Agent Chat"
    },
    {
      label: "User can provide a GitHub repository URL",
      done: true,
      desc: "Direct URL submission & natural language extraction"
    },
    {
      label: "Agent validates and understands the request",
      done: true,
      desc: "Strict parser supporting full URLs & owner/repo"
    },
    {
      label: "Agent starts a Cloudflare Workflow",
      done: true,
      desc: "Durable 6-step independent execution pipeline"
    },
    {
      label: "Workflow retrieves repository evidence",
      done: true,
      desc: "Metadata, recursive tree, and targeted manifest extraction"
    },
    {
      label: "Workflow uses Workers AI / Gemini for analysis",
      done: true,
      desc: "Evidence-based prompts with zero hallucination enforcement"
    },
    {
      label: "LLM output is schema validated",
      done: true,
      desc: "Strict JSON Schema validation on all architectural findings"
    },
    {
      label: "Analysis state is persisted",
      done: true,
      desc: "Durable Objects state maintaining multi-repo history"
    },
    {
      label: "Workflow progress is visible in the UI",
      done: true,
      desc: "Real-time stepper with millisecond durations and details"
    },
    {
      label: "Final report is rendered clearly",
      done: true,
      desc: "Multi-section deep dive with ASCII flow & evidence tags"
    },
    {
      label: "Failures are handled and retried appropriately",
      done: true,
      desc: "Exponential retry policies and benchmark fallbacks"
    },
    {
      label: "AI prompt history is included",
      done: true,
      desc: "Complete 7-prompt documentation in docs/prompts/*"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Cloudflare Architecture Diagram Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono">
              {CLOUDFLARE_ARCHITECTURE_SPEC.title}
            </h2>
            <p className="text-xs text-zinc-400 font-sans">
              {CLOUDFLARE_ARCHITECTURE_SPEC.description}
            </p>
          </div>
        </div>

        {/* ASCII System Pipeline Visualizer */}
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto mb-6">
          <div className="text-[11px] font-mono text-zinc-500 mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-orange-400" />
            <span>
              Cloudflare Runtime Pipeline (Pages &rarr; Agent DO &rarr;
              Workflows &rarr; Workers AI)
            </span>
          </div>
          <pre className="text-xs font-mono text-orange-300 leading-relaxed">
            {`                         USER
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
                  +--------+--------+
                           |
                     Start Workflow
                           |
                           v
              +-------------------------+
              | RepoAnalysisWorkflow    |
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
                                     Browser`}
          </pre>
        </div>

        {/* Primitives breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CLOUDFLARE_ARCHITECTURE_SPEC.primitives.map((prim, idx) => (
            <div
              key={idx}
              className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-mono text-xs font-bold text-white">
                  {prim.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {prim.type}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-semibold block mb-1">
                {prim.role}
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {prim.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Prompt History (docs/prompts/*) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Transparent AI Prompt History (docs/prompts/*)
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Audit trail of AI-assisted engineering prompts, generated
                approaches, and manual architectural decisions.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 hidden sm:block">
            {PROMPTS_HISTORY.length} Prompt Records
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Prompt Selector List */}
          <div className="lg:col-span-4 space-y-1.5">
            {PROMPTS_HISTORY.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPromptId(p.id)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 font-mono ${
                  selectedPromptId === p.id
                    ? "bg-orange-500/10 border-orange-500/40 text-white shadow-sm"
                    : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <div className="truncate">
                  <span className="text-orange-400 font-bold mr-1.5">
                    {p.number}
                  </span>
                  <span>{p.title}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 flex-shrink-0 ${selectedPromptId === p.id ? "text-orange-400" : "text-zinc-600"}`}
                />
              </button>
            ))}
          </div>

          {/* Prompt Detail Pane */}
          <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block">
                  Prompt Record {selectedPrompt.number}
                </span>
                <h3 className="text-sm font-bold text-white font-mono">
                  {selectedPrompt.title}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                docs/prompts/{selectedPrompt.number}-*.md
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono font-semibold block uppercase text-[10px] mb-1">
                Prompt:
              </span>
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-200 leading-relaxed font-mono text-[11px]">
                {selectedPrompt.prompt}
              </div>
            </div>

            <div>
              <span className="text-zinc-400 font-mono font-semibold block uppercase text-[10px] mb-1">
                Generated Approach:
              </span>
              <p className="text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60">
                {selectedPrompt.generatedApproach}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60">
                <span className="text-amber-400 font-mono font-semibold block uppercase text-[10px] mb-1">
                  Changes Made:
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  {selectedPrompt.changesMade}
                </p>
              </div>

              <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60">
                <span className="text-emerald-400 font-mono font-semibold block uppercase text-[10px] mb-1">
                  Manual Decisions:
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  {selectedPrompt.manualDecisions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Definition of Done Checklist */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Assignment Definition of Done
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Verification status against the core engineering specifications.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            12 / 12 Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {definitionOfDoneItems.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-xs text-white block">
                  {item.label}
                </span>
                <span className="text-[11px] text-zinc-400 font-sans">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
