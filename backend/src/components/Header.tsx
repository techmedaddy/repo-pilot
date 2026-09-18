import React from "react";
import {
  Bot,
  GitBranch,
  Cpu,
  Sparkles,
  Layers,
  FileText,
  ArrowLeftRight
} from "lucide-react";

interface HeaderProps {
  activeTab: "chat" | "report" | "compare" | "architecture";
  setActiveTab: (tab: "chat" | "report" | "compare" | "architecture") => void;
  activeRepoName?: string;
  hasGeminiKey: boolean;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeRepoName,
  hasGeminiKey,
  isAnalyzing
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Primitives Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            aria-label="Open RepoPilot chat"
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setActiveTab("chat")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                  RepoPilot
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Cloudflare Agent
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans hidden sm:block">
                Evidence-Based GitHub Repository Analyst
              </p>
            </div>
          </button>

          {/* Active Repo Pill */}
          {activeRepoName && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300">
              <GitBranch className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-zinc-500">active:</span>
              <span className="font-semibold text-white">{activeRepoName}</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs w-full sm:w-auto justify-center">
          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "chat"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-orange-400" />
            <span>Agent & Chat</span>
            {isAnalyzing && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            )}
          </button>

          <button
            id="tab-btn-report"
            onClick={() => setActiveTab("report")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "report"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Structured Report</span>
          </button>

          <button
            id="tab-btn-compare"
            onClick={() => setActiveTab("compare")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "compare"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
            <span>Compare Repos</span>
          </button>

          <button
            id="tab-btn-architecture"
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "architecture"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>CF Architecture & Prompts</span>
          </button>
        </nav>

        {/* Runtime Status Badges */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
            <Cpu className="w-3 h-3 text-orange-400" />
            <span className="text-zinc-400">Workflow:</span>
            <span className="text-emerald-400 font-medium">Durable DO</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-400">LLM:</span>
            <span
              className={
                hasGeminiKey
                  ? "text-amber-400 font-medium"
                  : "text-zinc-300 font-medium"
              }
            >
              {hasGeminiKey ? "Gemini 3.8" : "Workers AI Rule Engine"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
