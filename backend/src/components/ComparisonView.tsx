import React, { useState } from "react";
import type { StructuredReport, RepoComparison } from "../types";
import {
  ArrowLeftRight,
  GitCompare,
  Shield,
  CheckCircle,
  Cpu,
  Activity,
  Server,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface ComparisonViewProps {
  reports: StructuredReport[];
  onTriggerCompare: (
    repoAId: string,
    repoBId: string
  ) => Promise<RepoComparison | null>;
  initialComparison?: RepoComparison | null;
  onAnalyzeRepo: (url: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  reports,
  onTriggerCompare,
  initialComparison,
  onAnalyzeRepo
}) => {
  const [repoAId, setRepoAId] = useState<string>(reports[0]?.id || "");
  const [repoBId, setRepoBId] = useState<string>(reports[1]?.id || "");
  const [comparison, setComparison] = useState<RepoComparison | null>(
    initialComparison || null
  );
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!repoAId || !repoBId || repoAId === repoBId) return;
    setLoading(true);
    const res = await onTriggerCompare(repoAId, repoBId);
    if (res) setComparison(res);
    setLoading(false);
  };

  const getDimensionIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "architecture pattern":
        return <Cpu className="w-4 h-4 text-orange-400" />;
      case "data layer & caching":
        return <Server className="w-4 h-4 text-blue-400" />;
      case "reliability & idempotency":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "observability & telemetry":
        return <Activity className="w-4 h-4 text-purple-400" />;
      case "security & secrets":
        return <Shield className="w-4 h-4 text-red-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Selector Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono">
              Cross-Repository Architectural Comparison
            </h2>
            <p className="text-xs text-zinc-400 font-sans">
              Compare two evaluated repositories across Architecture,
              Reliability, Observability, Security, Scalability, and Deployment.
            </p>
          </div>
        </div>

        {reports.length < 2 ? (
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400">
            <p className="mb-2 text-zinc-300 font-semibold">
              Currently {reports.length} repository evaluated. You need at least
              two repositories to run side-by-side comparisons.
            </p>
            <p className="mb-3 text-zinc-400">
              Quickly analyze another repository to unlock full comparative
              analytics:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  onAnalyzeRepo("https://github.com/expressjs/express")
                }
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-xs transition-colors"
              >
                + Analyze expressjs/express
              </button>
              <button
                onClick={() =>
                  onAnalyzeRepo("https://github.com/fastapi/fastapi")
                }
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-xs transition-colors"
              >
                + Analyze fastapi/fastapi
              </button>
              <button
                onClick={() =>
                  onAnalyzeRepo("https://github.com/supabase/supabase")
                }
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-xs transition-colors"
              >
                + Analyze supabase/supabase
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label
                htmlFor="select-repo-a"
                className="text-xs font-mono text-zinc-400 block mb-1.5"
              >
                Repository A
              </label>
              <select
                id="select-repo-a"
                value={repoAId}
                onChange={(e) => setRepoAId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.owner}/{r.repoName} ({r.architecture.pattern})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="select-repo-b"
                className="text-xs font-mono text-zinc-400 block mb-1.5"
              >
                Repository B
              </label>
              <select
                id="select-repo-b"
                value={repoBId}
                onChange={(e) => setRepoBId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.owner}/{r.repoName} ({r.architecture.pattern})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                id="execute-compare-btn"
                onClick={handleCompare}
                disabled={
                  loading || !repoAId || !repoBId || repoAId === repoBId
                }
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Comparing Architectures...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Generate Side-by-Side Comparison</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Comparative Synthesis
            </h3>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans">
              {comparison.summary}
            </p>
          </div>

          {/* Dimension Comparison Matrix */}
          <div className="space-y-3">
            {comparison.dimensions.map((dim, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/80">
                  {getDimensionIcon(dim.name)}
                  <h4 className="font-mono text-xs font-bold text-white">
                    {dim.name}
                  </h4>
                  <span className="ml-auto text-[10px] text-zinc-500 font-mono">
                    Dimension {idx + 1} of 6
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <span className="text-[11px] font-mono font-semibold text-orange-400 block mb-1">
                      {comparison.repoA}
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {dim.repoAObservation}
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <span className="text-[11px] font-mono font-semibold text-blue-400 block mb-1">
                      {comparison.repoB}
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {dim.repoBObservation}
                    </p>
                  </div>
                </div>

                {/* Verdict */}
                <div className="mt-3 pt-2 border-t border-zinc-800/60 text-xs flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Verdict:
                  </span>
                  <span className="text-emerald-400 font-medium font-mono text-[11px]">
                    {dim.verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Joint Recommendations */}
          {comparison.recommendations.length > 0 && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Cross-Repository Recommendations</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300 list-disc list-inside">
                {comparison.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
