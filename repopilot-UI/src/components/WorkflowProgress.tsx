import React, { useState } from 'react';
import { WorkflowExecution } from '../types';
import { CheckCircle2, Loader2, Clock, AlertCircle, ChevronDown, ChevronUp, Terminal, Shield, FileCode2 } from 'lucide-react';

interface WorkflowProgressProps {
  workflow: WorkflowExecution | null;
  onViewReport?: () => void;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ workflow, onViewReport }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!workflow) return null;

  const completedCount = workflow.steps.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / workflow.steps.length) * 100);

  return (
    <div id="workflow-progress-panel" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl mb-6 backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            {workflow.status === 'running' ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            ) : workflow.status === 'completed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white font-mono tracking-tight">
                {workflow.status === 'running' && 'Executing Durable Analysis Workflow...'}
                {workflow.status === 'completed' && 'Durable Workflow Completed'}
                {workflow.status === 'failed' && 'Workflow Execution Interrupted'}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                workflow.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : workflow.status === 'running'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {workflow.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate max-w-md font-mono mt-0.5">
              Target: <span className="text-zinc-300">{workflow.repoUrl}</span>
            </p>
          </div>
        </div>

        {/* Action & Percent */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-zinc-400">{completedCount} of {workflow.steps.length} steps</span>
            <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  workflow.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {workflow.status === 'completed' && onViewReport && (
            <button
              id="view-report-from-workflow-btn"
              onClick={onViewReport}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-orange-500/20 flex items-center gap-1.5"
            >
              <span>View Structured Report</span>
            </button>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Toggle Step Telemetry"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
        {workflow.steps.map((step, idx) => {
          const isCurrent = workflow.currentStepIndex === idx && workflow.status === 'running';
          const isDone = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isPending = step.status === 'pending';

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border transition-all text-xs ${
                isCurrent
                  ? 'bg-orange-500/5 border-orange-500/30 text-white'
                  : isDone
                  ? 'bg-zinc-950/40 border-zinc-800 text-zinc-300'
                  : isFailed
                  ? 'bg-red-500/5 border-red-500/30 text-red-300'
                  : 'bg-zinc-950/20 border-zinc-800/50 text-zinc-500'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">
                  {isCurrent && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />}
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  {isPending && <span className="w-3.5 h-3.5 inline-block rounded-full border border-zinc-700 text-center text-[9px] leading-3 text-zinc-600">{idx + 1}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold truncate font-mono text-[11px]">{step.label}</span>
                    {step.durationMs !== undefined && (
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {step.durationMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">{step.description}</p>
                  {step.details && (
                    <p className="text-[10px] text-orange-400/90 font-mono mt-1 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800/60 truncate">
                      {step.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Telemetry Drawer */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-lg font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              Workflow Execution Telemetry (Cloudflare Workflows Runtime)
            </span>
            <span className="text-[11px] text-zinc-500">Workflow ID: {workflow.id}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-zinc-500 block">State Persistence:</span>
              <span className="text-emerald-400">Durable Object Committed</span>
            </div>
            <div>
              <span className="text-zinc-500 block">LLM Verification:</span>
              <span className="text-amber-400">JSON Schema Validated</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Evidence Guardrail:</span>
              <span className="text-blue-400">Strict File-Level Citations</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Retry Policy:</span>
              <span className="text-zinc-300">Exponential Backoff (3x)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
