import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ImplementationChecklist } from '../types';
import { Send, Bot, User, Sparkles, CheckSquare, Square, ShieldAlert, GitPullRequest, ArrowRight, ExternalLink, Check, X, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAnalyzeRepo: (url: string) => void;
  onApproveChecklist: (reportId: string, hitlId: string) => void;
  onRejectChecklist: (reportId: string, hitlId: string) => void;
  onToggleChecklistItem: (checklistId: string, itemId: string, done: boolean) => void;
  onViewReport: (reportId?: string) => void;
  isAnalyzing: boolean;
  isReplying: boolean;
}

const SAMPLE_REPOS = [
  {
    name: 'techmedaddy/TorrentEdge',
    url: 'https://github.com/techmedaddy/TorrentEdge',
    badge: 'Featured Benchmark',
    desc: 'Distributed artifact pipeline with Kafka, PostgreSQL, Redis, S3, OTel'
  },
  {
    name: 'expressjs/express',
    url: 'https://github.com/expressjs/express',
    badge: 'Classic Node.js',
    desc: 'Minimalist web framework with middleware pipeline'
  },
  {
    name: 'fastapi/fastapi',
    url: 'https://github.com/fastapi/fastapi',
    badge: 'Python Async',
    desc: 'Modern, fast web framework for building APIs'
  },
  {
    name: 'supabase/supabase',
    url: 'https://github.com/supabase/supabase',
    badge: 'Distributed Cloud',
    desc: 'Open source Firebase alternative with Postgres and Auth'
  }
];

const SUGGESTED_QUESTIONS = [
  'Explain the Kafka reliability & idempotency strategy',
  'What are the high-severity security vulnerabilities?',
  'Compare this with my previous repository',
  'What are the primary scalability bottlenecks?'
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onAnalyzeRepo,
  onApproveChecklist,
  onRejectChecklist,
  onToggleChecklistItem,
  onViewReport,
  isAnalyzing,
  isReplying
}) => {
  const [input, setInput] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReplying, isAnalyzing]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isReplying) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim() || isAnalyzing) return;
    onAnalyzeRepo(repoInput.trim());
    setRepoInput('');
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Top Repository Submission Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mb-4 backdrop-blur-sm">
        <form onSubmit={handleRepoSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              id="github-repo-input"
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="Submit GitHub repository (e.g. https://github.com/techmedaddy/TorrentEdge or owner/repo)"
              className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-orange-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors font-mono"
              disabled={isAnalyzing}
            />
          </div>
          <button
            id="start-analysis-btn"
            type="submit"
            disabled={isAnalyzing || !repoInput.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-zinc-950 font-bold text-sm rounded-lg transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Workflow...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>Analyze Repository</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Sample Repositories */}
        <div className="mt-3 pt-3 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <span className="font-semibold text-zinc-300">Quick Demonstrations:</span>
            <span className="text-[11px] text-zinc-500">Click to start durable analysis</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SAMPLE_REPOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => onAnalyzeRepo(sample.url)}
                disabled={isAnalyzing}
                className="text-left p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-orange-500/40 transition-all group"
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-mono text-xs font-semibold text-zinc-200 group-hover:text-orange-400 truncate">
                    {sample.name.split('/')[1]}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:bg-orange-500/10 group-hover:text-orange-400">
                    {sample.badge}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-1">{sample.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[360px] max-h-[560px]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-orange-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-4 shadow-sm ${
                  isUser
                    ? 'bg-orange-500/10 border border-orange-500/30 text-zinc-100 ml-auto'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300 font-mono">
                    {isUser ? 'You' : 'RepoPilot Agent'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body with markdown formatting */}
                <div className="text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Report view button if message references report */}
                {msg.reportId && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center gap-2">
                    <button
                      onClick={() => onViewReport(msg.reportId)}
                      className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Full Structured Report</span>
                    </button>
                  </div>
                )}

                {/* Human In The Loop (HITL) Checklist Prompt */}
                {msg.hitlPrompt && msg.hitlPrompt.status === 'pending' && (
                  <div className="mt-3.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold block text-white">
                          Human-in-the-Loop Approval Required
                        </span>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          {msg.hitlPrompt.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <button
                            id="hitl-approve-btn"
                            onClick={() => onApproveChecklist(msg.reportId || '', msg.hitlPrompt?.id || '')}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Generate</span>
                          </button>
                          <button
                            id="hitl-reject-btn"
                            onClick={() => onRejectChecklist(msg.reportId || '', msg.hitlPrompt?.id || '')}
                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-md transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Checklist Rendering */}
                {msg.checklist && (
                  <div className="mt-3 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-sans">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
                      <span className="font-semibold text-xs text-white flex items-center gap-1.5 font-mono">
                        <GitPullRequest className="w-3.5 h-3.5 text-orange-400" />
                        {msg.checklist.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {msg.checklist.items.filter(i => i.done).length} / {msg.checklist.items.length} completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {msg.checklist.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onToggleChecklistItem(msg.checklist!.id, item.id, !item.done)}
                          className="flex items-start gap-2.5 p-2 rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group"
                        >
                          <button className="mt-0.5 text-zinc-400 group-hover:text-orange-400">
                            {item.done ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-500" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs ${item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                              {item.task}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                                item.priority === 'high'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : item.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {item.priority.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono truncate">
                                📁 {item.fileRef}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-zinc-300" />
                </div>
              )}
            </div>
          );
        })}

        {isReplying && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-orange-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-zinc-400 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span>RepoPilot agent is reasoning over repository evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Prompts */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-zinc-500 text-[11px] whitespace-nowrap">Suggested:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(q)}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-orange-400 text-[11px] whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* User Message Input Form */}
      <form onSubmit={handleSend} className="mt-2 relative flex items-center">
        <input
          id="chat-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask RepoPilot about architecture, reliability, scale, security, or compare repositories..."
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
          disabled={isReplying}
        />
        <button
          id="send-chat-btn"
          type="submit"
          disabled={!input.trim() || isReplying}
          className="absolute right-2 p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-zinc-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Send Message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
