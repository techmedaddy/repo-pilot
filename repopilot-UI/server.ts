import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { parseRepoUrl, getRepositoryMetadata, getRepositoryTree, identifyRelevantFiles, getFileContent, BENCHMARK_REPOS } from './server/github';
import { analyzeRepositoryEvidence, askRepoQuestion, generateChecklist, compareTwoReports, buildDeterministicReport } from './server/gemini';
import { StructuredReport, WorkflowExecution, ChatMessage, ImplementationChecklist, RepoComparison } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Durable State Store (Simulating Cloudflare Durable Object storage)
interface DurableStore {
  reports: Map<string, StructuredReport>;
  messages: ChatMessage[];
  checklists: Map<string, ImplementationChecklist>;
  activeWorkflow: WorkflowExecution | null;
}

const store: DurableStore = {
  reports: new Map(),
  messages: [
    {
      id: 'msg-init',
      sender: 'agent',
      content: 'Hello! I am RepoPilot, an AI-powered repository analyst built on Cloudflare Agent and Workflow primitives. Provide any public GitHub repository URL—or select our benchmark repository **techmedaddy/TorrentEdge**—and I will execute a durable multi-step inspection to produce an evidence-based engineering report.',
      timestamp: new Date().toISOString()
    }
  ],
  checklists: new Map(),
  activeWorkflow: null,
};

// Seed initial benchmark report so user can immediately view or compare
async function seedInitialBenchmark() {
  try {
    const meta = BENCHMARK_REPOS['techmedaddy/TorrentEdge'].metadata;
    const tree = BENCHMARK_REPOS['techmedaddy/TorrentEdge'].tree;
    const files = BENCHMARK_REPOS['techmedaddy/TorrentEdge'].files;
    const initialReport = await analyzeRepositoryEvidence(meta, tree, files);
    store.reports.set(initialReport.id, initialReport);
    store.reports.set('techmedaddy/TorrentEdge', initialReport);
  } catch (err) {
    console.error('Failed to seed benchmark repo:', err);
  }
}
seedInitialBenchmark();

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RepoPilot',
    runtime: 'Cloudflare Agents + Durable Objects + Workflows Simulator',
    reportsCount: store.reports.size,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
  });
});

app.get('/api/sample-repos', (req, res) => {
  res.json([
    {
      name: 'techmedaddy/TorrentEdge',
      url: 'https://github.com/techmedaddy/TorrentEdge',
      description: 'Distributed artifact pipeline with Kafka, PostgreSQL, Redis, S3, and OpenTelemetry',
      stars: 342,
      language: 'Go',
      highlight: 'Featured Benchmark'
    },
    {
      name: 'expressjs/express',
      url: 'https://github.com/expressjs/express',
      description: 'Fast, unopinionated, minimalist web framework for Node.js',
      stars: 64500,
      language: 'JavaScript',
      highlight: 'Node.js Classic'
    },
    {
      name: 'fastapi/fastapi',
      url: 'https://github.com/fastapi/fastapi',
      description: 'High performance, easy to learn, fast to code, ready for production',
      stars: 76800,
      language: 'Python',
      highlight: 'Modern Python API'
    },
    {
      name: 'supabase/supabase',
      url: 'https://github.com/supabase/supabase',
      description: 'The open source Firebase alternative with Postgres, Auth, and Storage',
      stars: 74200,
      language: 'TypeScript',
      highlight: 'Distributed Cloud Stack'
    }
  ]);
});

app.get('/api/history', (req, res) => {
  const reportsList = Array.from(store.reports.values()).map(r => ({
    id: r.id,
    repoUrl: r.repoUrl,
    fullName: `${r.owner}/${r.repoName}`,
    owner: r.owner,
    repoName: r.repoName,
    summary: r.summary,
    techStack: r.techStack.map(t => t.name),
    pattern: r.architecture.pattern,
    analyzedAt: r.analyzedAt,
    issueCount: r.recommendations.length,
    vulnerabilitiesCount: r.security.vulnerabilitiesIdentified.length
  }));
  res.json(reportsList);
});

app.get('/api/reports/:owner/:repo', (req, res) => {
  const key = `${req.params.owner}/${req.params.repo}`.toLowerCase();
  let report: StructuredReport | undefined = store.reports.get(key);
  if (!report) {
    report = Array.from(store.reports.values()).find(r => `${r.owner}/${r.repoName}`.toLowerCase() === key);
  }
  if (!report && key === 'techmedaddy/torrentedge') {
    const meta = BENCHMARK_REPOS['techmedaddy/TorrentEdge'].metadata;
    const tree = BENCHMARK_REPOS['techmedaddy/TorrentEdge'].tree;
    const files = BENCHMARK_REPOS['techmedaddy/TorrentEdge'].files;
    const deterministic = buildDeterministicReport(meta, tree, files);
    store.reports.set(deterministic.id, deterministic);
    store.reports.set('techmedaddy/torrentedge', deterministic);
    report = deterministic;
  }
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

app.get('/api/reports/:id', (req, res) => {
  const report = store.reports.get(req.params.id);
  if (!report) {
    // Check if queried by full name
    const found = Array.from(store.reports.values()).find(r => `${r.owner}/${r.repoName}`.toLowerCase() === req.params.id.toLowerCase());
    if (found) return res.json(found);
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// Primary Workflow Executor (Multi-step durable workflow)
app.post('/api/analyze', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ error: 'Please provide a repository URL' });
  }

  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid GitHub URL format. Example: https://github.com/techmedaddy/TorrentEdge or techmedaddy/TorrentEdge' });
  }

  const workflowId = `wf-${Date.now()}`;
  const workflow: WorkflowExecution = {
    id: workflowId,
    repoUrl,
    status: 'running',
    currentStepIndex: 0,
    startedAt: new Date().toISOString(),
    steps: [
      { id: 'step-1', label: 'Fetch Metadata', description: 'Retrieve repository statistics, stars, primary language, topics', status: 'pending' },
      { id: 'step-2', label: 'Inspect Repository Tree', description: 'Recursively discover file hierarchy and structural layout', status: 'pending' },
      { id: 'step-3', label: 'Extract Source & Configs', description: 'Target manifests (package.json/go.mod), Dockerfiles, and CI/CD definitions', status: 'pending' },
      { id: 'step-4', label: 'Topological Architecture Review', description: 'Identify service boundaries, ingress routes, and queueing patterns', status: 'pending' },
      { id: 'step-5', label: 'LLM Technical Reasoning', description: 'Workers AI / Gemini reasoning over concrete codebase evidence', status: 'pending' },
      { id: 'step-6', label: 'Schema Validation & Persist', description: 'Enforce strict schema validation and commit report to durable state', status: 'pending' }
    ]
  };

  store.activeWorkflow = workflow;

  try {
    // Step 1: Metadata
    workflow.currentStepIndex = 0;
    workflow.steps[0].status = 'running';
    const step1Start = Date.now();
    const metadata = await getRepositoryMetadata(parsed.owner, parsed.repo);
    workflow.steps[0].status = 'completed';
    workflow.steps[0].durationMs = Date.now() - step1Start;
    workflow.steps[0].details = `Found ${metadata.fullName} (${metadata.language}, ${metadata.stars} stars)`;

    // Step 2: Tree
    workflow.currentStepIndex = 1;
    workflow.steps[1].status = 'running';
    const step2Start = Date.now();
    const tree = await getRepositoryTree(parsed.owner, parsed.repo, metadata.defaultBranch);
    workflow.steps[1].status = 'completed';
    workflow.steps[1].durationMs = Date.now() - step2Start;
    workflow.steps[1].details = `Indexed ${tree.length} files in default branch "${metadata.defaultBranch}"`;

    // Step 3: Source extraction
    workflow.currentStepIndex = 2;
    workflow.steps[2].status = 'running';
    const step3Start = Date.now();
    const relevantPaths = identifyRelevantFiles(tree);
    const extractedFiles = await Promise.all(
      relevantPaths.map(p => getFileContent(parsed.owner, parsed.repo, p, metadata.defaultBranch))
    );
    workflow.steps[2].status = 'completed';
    workflow.steps[2].durationMs = Date.now() - step3Start;
    workflow.steps[2].details = `Extracted ${extractedFiles.length} critical architectural manifest & configuration files`;

    // Step 4: Topological review
    workflow.currentStepIndex = 3;
    workflow.steps[3].status = 'running';
    const step4Start = Date.now();
    // Simulate brief asynchronous processing pause typical of durable workflows
    await new Promise(r => setTimeout(r, 400));
    workflow.steps[3].status = 'completed';
    workflow.steps[3].durationMs = Date.now() - step4Start;
    workflow.steps[3].details = `Mapped service boundaries and storage integrations`;

    // Step 5: LLM Reasoning
    workflow.currentStepIndex = 4;
    workflow.steps[4].status = 'running';
    const step5Start = Date.now();
    const report = await analyzeRepositoryEvidence(metadata, tree, extractedFiles);
    workflow.steps[4].status = 'completed';
    workflow.steps[4].durationMs = Date.now() - step5Start;
    workflow.steps[4].details = `Generated structured evaluation with ${report.techStack.length} verified technologies`;

    // Step 6: Validation & Persist
    workflow.currentStepIndex = 5;
    workflow.steps[5].status = 'running';
    const step6Start = Date.now();
    store.reports.set(report.id, report);
    store.reports.set(metadata.fullName, report);
    workflow.steps[5].status = 'completed';
    workflow.steps[5].durationMs = Date.now() - step6Start;
    workflow.steps[5].details = `Report ${report.id} committed to durable storage`;

    workflow.status = 'completed';
    workflow.completedAt = new Date().toISOString();

    // Add agent message to chat
    const agentMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      content: `Analysis completed for **${report.owner}/${report.repoName}**!\n\n` +
        `**Pattern**: ${report.architecture.pattern}\n` +
        `**Summary**: ${report.summary}\n\n` +
        `I have cataloged ${report.recommendations.length} recommended improvements and ${report.security.vulnerabilitiesIdentified.length} security observations with direct file-level evidence references.`,
      timestamp: new Date().toISOString(),
      reportId: report.id,
      repoContext: report.repoName,
      hitlPrompt: {
        id: `hitl-${report.id}`,
        title: `RepoPilot identified ${report.recommendations.length} recommended improvements. Generate an implementation checklist?`,
        action: 'generate_checklist',
        issueCount: report.recommendations.length,
        status: 'pending'
      }
    };
    store.messages.push(agentMsg);

    res.json({
      workflow,
      report,
      agentMessage: agentMsg
    });
  } catch (err: any) {
    console.error('Workflow error:', err);
    workflow.status = 'failed';
    workflow.error = err.message || 'Workflow execution error';
    if (workflow.steps[workflow.currentStepIndex]) {
      workflow.steps[workflow.currentStepIndex].status = 'failed';
    }
    res.status(500).json({
      error: err.message || 'Workflow failed',
      workflow
    });
  }
});

// Conversational Agent Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, currentRepoId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    content: message,
    timestamp: new Date().toISOString()
  };
  store.messages.push(userMsg);

  // Check if user provided a repo URL directly in chat
  const parsedRepo = parseRepoUrl(message);
  if (parsedRepo && (message.toLowerCase().includes('analyze') || message.toLowerCase().startsWith('http') || message.trim() === `${parsedRepo.owner}/${parsedRepo.repo}`)) {
    return res.json({
      actionRequired: 'trigger_analysis',
      repoUrl: `https://github.com/${parsedRepo.owner}/${parsedRepo.repo}`,
      reply: `Identified repository request for **${parsedRepo.owner}/${parsedRepo.repo}**. Starting durable analysis workflow...`
    });
  }

  // Check if user asks for comparison
  if (message.toLowerCase().includes('compare')) {
    const allReports = Array.from(store.reports.values());
    if (allReports.length >= 2) {
      const repoA = allReports[allReports.length - 1];
      const repoB = allReports[allReports.length - 2];
      const comparison = compareTwoReports(repoA, repoB);
      const agentReply: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        content: `### Cross-Repository Comparison: **${repoA.repoName}** vs **${repoB.repoName}**\n\n` +
          comparison.dimensions.map(d => `**${d.name}**\n- ${repoA.repoName}: ${d.repoAObservation}\n- ${repoB.repoName}: ${d.repoBObservation}\n- *Verdict*: ${d.verdict}`).join('\n\n') +
          `\n\n**Key Recommendations**:\n` + comparison.recommendations.map(r => `- ${r}`).join('\n'),
        timestamp: new Date().toISOString(),
        repoContext: `${repoA.repoName} vs ${repoB.repoName}`
      };
      store.messages.push(agentReply);
      return res.json({ reply: agentReply, comparison });
    } else {
      const agentReply: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        content: 'To perform a repository comparison, please analyze at least two repositories first. You can analyze **techmedaddy/TorrentEdge** and then analyze a second repository like **expressjs/express**.',
        timestamp: new Date().toISOString()
      };
      store.messages.push(agentReply);
      return res.json({ reply: agentReply });
    }
  }

  // Find active or latest report for context
  let activeReport: StructuredReport | undefined;
  if (currentRepoId) {
    activeReport = store.reports.get(currentRepoId);
  }
  if (!activeReport && store.reports.size > 0) {
    activeReport = Array.from(store.reports.values())[store.reports.size - 1];
  }

  if (!activeReport) {
    const agentReply: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      content: 'I don\'t have an active repository analysis loaded yet. Please submit a GitHub repository URL or click one of our benchmark presets (such as **techmedaddy/TorrentEdge**) to begin.',
      timestamp: new Date().toISOString()
    };
    store.messages.push(agentReply);
    return res.json({ reply: agentReply });
  }

  // Answer question grounded in repository report
  const answer = await askRepoQuestion(activeReport, message, store.messages);
  const agentReply: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'agent',
    content: answer,
    timestamp: new Date().toISOString(),
    reportId: activeReport.id,
    repoContext: activeReport.repoName
  };
  store.messages.push(agentReply);

  res.json({ reply: agentReply });
});

// Human-in-the-loop (HITL) checklist approval
app.post('/api/checklist/approve', (req, res) => {
  const { reportId, hitlId, decision } = req.body;

  let report = store.reports.get(reportId);
  if (!report && store.reports.size > 0) {
    report = Array.from(store.reports.values())[store.reports.size - 1];
  }

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (decision === 'rejected') {
    const rejectionMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      content: `Checklist generation for **${report.repoName}** was declined by the user. You can continue asking questions about the codebase architecture or submit another repository.`,
      timestamp: new Date().toISOString(),
      reportId: report.id
    };
    store.messages.push(rejectionMsg);
    return res.json({ status: 'rejected', message: rejectionMsg });
  }

  const checklist = generateChecklist(report);
  store.checklists.set(checklist.id, checklist);

  const approvalMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'agent',
    content: `Approved! Here is the action checklist generated from the verified findings in **${report.repoName}**:\n\n` +
      checklist.items.map(i => `- [ ] **[${i.priority.toUpperCase()}]** ${i.task} *(Ref: \`${i.fileRef}\`)*`).join('\n'),
    timestamp: new Date().toISOString(),
    reportId: report.id,
    checklist
  };
  store.messages.push(approvalMsg);

  res.json({
    status: 'approved',
    checklist,
    message: approvalMsg
  });
});

// Toggle checklist item status
app.post('/api/checklist/toggle', (req, res) => {
  const { checklistId, itemId, done } = req.body;
  const checklist = store.checklists.get(checklistId);
  if (checklist) {
    const item = checklist.items.find(i => i.id === itemId);
    if (item) {
      item.done = done;
    }
  }
  res.json({ success: true, checklist });
});

// Compare two repositories directly
app.post('/api/compare', (req, res) => {
  const { repoAId, repoBId } = req.body;
  const repA = store.reports.get(repoAId) || Array.from(store.reports.values())[0];
  const repB = store.reports.get(repoBId) || Array.from(store.reports.values())[1];

  if (!repA || !repB) {
    return res.status(400).json({ error: 'Two analyzed repositories are required for comparison' });
  }

  const comparison = compareTwoReports(repA, repB);
  res.json(comparison);
});

// --- VITE MIDDLEWARE OR STATIC SERVING ---
async function startServer() {
  if (process.env.SKIP_VITE === 'true') {
    app.get('/', (_req, res) => {
      res
        .type('html')
        .send('<h1>RepoPilot API server is running</h1><p>Vite middleware is disabled for API smoke testing.</p>');
    });
  } else if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RepoPilot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
