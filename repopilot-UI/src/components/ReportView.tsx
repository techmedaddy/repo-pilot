import React, { useState } from 'react';
import { StructuredReport } from '../types';
import { 
  Layers, Server, Database, Shield, Activity, Cpu, 
  Terminal, AlertTriangle, CheckCircle, ExternalLink, Download, 
  Copy, Check, FileCode, ArrowRight, HelpCircle, GitCommit, Sparkles
} from 'lucide-react';

interface ReportViewProps {
  report: StructuredReport | null;
  onSelectRepo?: (repoName: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const [activeSection, setActiveSection] = useState<'all' | 'architecture' | 'api' | 'data' | 'reliability' | 'security' | 'observability' | 'scalability' | 'recommendations'>('all');
  const [copied, setCopied] = useState(false);

  if (!report) {
    return (
      <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 max-w-3xl mx-auto">
        <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white font-mono">No Report Loaded</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          Submit a repository in the Agent Chat tab or select the benchmark repository <strong>techmedaddy/TorrentEdge</strong> to inspect the structured engineering report.
        </p>
      </div>
    );
  }

  const handleCopyMarkdown = () => {
    const md = `# RepoPilot Engineering Report: ${report.owner}/${report.repoName}
Analyzed At: ${report.analyzedAt}
Pattern: ${report.architecture.pattern}

## Summary
${report.summary}

## Architecture
${report.architecture.overview}

## Tech Stack
${report.techStack.map(t => `- **${t.name}** (${t.category}) — Evidence: \`${t.evidence}\``).join('\n')}

## Reliability
- Idempotency: ${report.reliability.idempotency}
- Failure Handling: ${report.reliability.failureHandling}

## Security
- Authentication: ${report.security.authentication}
- Secret Handling: ${report.security.secretHandling}
${report.security.vulnerabilitiesIdentified.map(v => `  - [${v.severity.toUpperCase()}] ${v.explanation} (\`${v.evidence}\`): ${v.recommendation}`).join('\n')}

## Recommendations
${report.recommendations.map(r => `### [${r.severity.toUpperCase()}] ${r.category}\n- Evidence: \`${r.evidence}\`\n- Explanation: ${r.explanation}\n- Fix: ${r.recommendation}`).join('\n\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repopilot-${report.repoName}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Report Header Card */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {report.architecture.pattern}
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs font-mono">
                Analyzed on {new Date(report.analyzedAt).toLocaleDateString()} at {new Date(report.analyzedAt).toLocaleTimeString()}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono mt-1 flex items-center gap-2">
              <span>{report.owner} / {report.repoName}</span>
              <a
                href={report.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-orange-400 transition-colors"
                title="View on GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </h1>
          </div>

          {/* Export and Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700/80 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied MD' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700/80 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
            Architectural Executive Summary
          </h4>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {report.summary}
          </p>
        </div>

        {/* Verified Tech Stack Chips */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Verified Technologies & Evidence Citations
          </h4>
          <div className="flex flex-wrap gap-2">
            {report.techStack.map((tech, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center gap-2 shadow-sm"
              >
                <span className="font-semibold text-white">{tech.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                  {tech.category}
                </span>
                <span className="text-[10px] text-orange-400/90 font-mono" title={`Verified via ${tech.evidence}`}>
                  🔍 {tech.evidence.split('&')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter / Section Quick Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: 'All Dimensions' },
          { id: 'architecture', label: 'Architecture & Flow' },
          { id: 'api', label: 'API Design' },
          { id: 'data', label: 'Data Layer' },
          { id: 'reliability', label: 'Reliability' },
          { id: 'observability', label: 'Observability' },
          { id: 'security', label: 'Security' },
          { id: 'scalability', label: 'Scalability' },
          { id: 'recommendations', label: `Recommendations (${report.recommendations.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? 'bg-orange-500 text-zinc-950 font-bold shadow-md shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION: ARCHITECTURE & ASCII TOPOLOGY */}
      {(activeSection === 'all' || activeSection === 'architecture') && (
        <section id="section-architecture" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-orange-400" />
            <h3 className="text-base font-bold text-white font-mono">1. System Architecture & Component Flow</h3>
          </div>
          <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
            {report.architecture.overview}
          </p>

          {/* ASCII / Component Topology Diagram */}
          {report.architecture.asciiDiagram && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-3 py-1 bg-zinc-950 rounded-t-lg border-t border-x border-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-orange-400" />
                  Service Topology & Communication Pipeline
                </span>
                <span className="text-zinc-500">Verified from Compose & Source</span>
              </div>
              <pre className="p-4 bg-zinc-950 rounded-b-lg border border-zinc-800 font-mono text-[11px] text-orange-300/90 overflow-x-auto leading-relaxed shadow-inner">
                {report.architecture.asciiDiagram.trim()}
              </pre>
            </div>
          )}

          {/* Components Grid */}
          <h4 className="text-xs font-semibold text-zinc-300 font-mono mb-2 uppercase tracking-wider">
            Observed System Components
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {report.architecture.components.map((comp, idx) => (
              <div key={idx} className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs text-white font-mono">{comp.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 font-mono">
                    {comp.technology}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">{comp.role}</p>
                <div className="mt-2 text-[10px] text-orange-400/80 font-mono truncate">
                  Evidence: {comp.evidence}
                </div>
              </div>
            ))}
          </div>

          {/* Data Flow Steps */}
          <h4 className="text-xs font-semibold text-zinc-300 font-mono mb-2 uppercase tracking-wider">
            Verified Execution Data Flow
          </h4>
          <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            {report.architecture.dataFlow.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-sans">
                <span className="text-orange-400 font-mono font-bold">{idx + 1}.</span>
                <span>{step.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: API DESIGN & DATA LAYER */}
      {(activeSection === 'all' || activeSection === 'api' || activeSection === 'data') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* API Design */}
          {(activeSection === 'all' || activeSection === 'api') && (
            <section id="section-api" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono">2. API Design & Ingress</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-mono">Protocol:</span>
                  <span className="text-zinc-200 font-semibold">{report.apiDesign.protocol}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Observed Route Endpoints:</span>
                  <div className="space-y-1 mt-1 font-mono">
                    {report.apiDesign.endpointsObserved.map((ep, i) => (
                      <div key={i} className="px-2 py-1 bg-zinc-950 rounded text-[11px] text-zinc-300 border border-zinc-800/80">
                        {ep}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Validation Pattern:</span>
                  <p className="text-zinc-300">{report.apiDesign.validation}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Error Handling Strategy:</span>
                  <p className="text-zinc-300">{report.apiDesign.errorHandling}</p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Evidence: {report.apiDesign.evidence}
                </div>
              </div>
            </section>
          )}

          {/* Data Layer */}
          {(activeSection === 'all' || activeSection === 'data') && (
            <section id="section-data" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white font-mono">3. Data Layer & Persistence</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-mono">Primary Storage:</span>
                  <p className="text-zinc-200 font-semibold">{report.dataLayer.primaryStorage}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">In-Memory Caching Tier:</span>
                  <p className="text-zinc-300">{report.dataLayer.caching}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Persistence Architecture:</span>
                  <p className="text-zinc-300">{report.dataLayer.persistenceModel}</p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Evidence: {report.dataLayer.evidence}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* SECTION: RELIABILITY & OBSERVABILITY */}
      {(activeSection === 'all' || activeSection === 'reliability' || activeSection === 'observability') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Reliability */}
          {(activeSection === 'all' || activeSection === 'reliability') && (
            <section id="section-reliability" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">4. Reliability & Recovery</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-mono">Idempotency Controls:</span>
                  <p className="text-zinc-300">{report.reliability.idempotency}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Retries & Backoff:</span>
                  <p className="text-zinc-300">{report.reliability.retriesAndBackoff}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Failure Handling:</span>
                  <p className="text-zinc-300">{report.reliability.failureHandling}</p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Evidence: {report.reliability.evidence}
                </div>
              </div>
            </section>
          )}

          {/* Observability */}
          {(activeSection === 'all' || activeSection === 'observability') && (
            <section id="section-observability" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono">5. Observability & Telemetry</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-mono">Distributed Tracing:</span>
                  <p className="text-zinc-200 font-semibold">{report.observability.tracing}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Metrics Collection:</span>
                  <p className="text-zinc-300">{report.observability.metrics}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Structured Logging:</span>
                  <p className="text-zinc-300">{report.observability.logging}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Health Probes:</span>
                  <p className="text-zinc-300">{report.observability.healthChecks}</p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Evidence: {report.observability.evidence}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* SECTION: SECURITY & SCALABILITY */}
      {(activeSection === 'all' || activeSection === 'security' || activeSection === 'scalability') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Security */}
          {(activeSection === 'all' || activeSection === 'security') && (
            <section id="section-security" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white font-mono">6. Security & Vulnerabilities</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-mono">Authentication & Authorization:</span>
                  <p className="text-zinc-300">{report.security.authentication}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Secret Handling:</span>
                  <p className="text-zinc-300">{report.security.secretHandling}</p>
                </div>

                {/* Identified vulnerabilities */}
                <div>
                  <span className="text-zinc-400 font-semibold block font-mono mb-1.5">
                    Flagged Configuration Risks ({report.security.vulnerabilitiesIdentified.length}):
                  </span>
                  <div className="space-y-2">
                    {report.security.vulnerabilitiesIdentified.map((v) => (
                      <div key={v.id} className="p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-red-400 font-mono text-[11px]">{v.category}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 font-mono font-bold">
                            {v.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-xs">{v.explanation}</p>
                        <div className="mt-1.5 text-[10px] text-zinc-400 font-mono">
                          Fix: <span className="text-emerald-400">{v.recommendation}</span>
                        </div>
                        <div className="mt-1 text-[10px] text-zinc-500 font-mono">
                          Evidence: {v.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Scalability & Deployment */}
          {(activeSection === 'all' || activeSection === 'scalability') && (
            <section id="section-scalability" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">7. Scalability & Deployment</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-mono">Concurrency & Scaling Model:</span>
                  <p className="text-zinc-200 font-semibold">{report.scalability.model}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Queueing Architecture:</span>
                  <p className="text-zinc-300">{report.scalability.queueingObserved}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">Potential Bottlenecks:</span>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 mt-1">
                    {report.scalability.bottlenecks.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500 block font-mono">Deployment Orchestration:</span>
                  <p className="text-zinc-300">{report.deployment.containers} / {report.deployment.orchestration}</p>
                </div>
                <div>
                  <span className="text-zinc-500 block font-mono">CI/CD Automation:</span>
                  <p className="text-zinc-300">{report.deployment.ciCd}</p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Evidence: {report.deployment.evidence}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* SECTION: RECOMMENDATIONS TABLE */}
      {(activeSection === 'all' || activeSection === 'recommendations') && (
        <section id="section-recommendations" className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white font-mono">
                8. Prioritized Recommendations ({report.recommendations.length})
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Direct File Evidence Linked
            </span>
          </div>

          <div className="space-y-3">
            {report.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      rec.severity === 'high' || rec.severity === 'critical'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : rec.severity === 'medium'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {rec.severity}
                    </span>
                    <span className="font-semibold text-xs text-white font-mono">{rec.category}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    📁 {rec.evidence}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 mt-2 font-sans leading-relaxed">
                  {rec.explanation}
                </p>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-xs text-emerald-400 flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span><strong>Recommended Fix:</strong> {rec.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: UNCERTAINTIES & MISSING CONTEXT */}
      {report.uncertainties.length > 0 && (
        <section id="section-uncertainties" className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
            <span>Explicit Uncertainties & Unverified Assumptions</span>
          </div>
          <p className="text-[11px] text-zinc-500 mb-2">
            In compliance with strict evidence rules, the following items could not be conclusively determined from the repository artifacts:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
            {report.uncertainties.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
