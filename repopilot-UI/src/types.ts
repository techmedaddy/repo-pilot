export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  topics: string[];
  license?: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface RepoTreeFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface ExtractedFile {
  path: string;
  category: 'package' | 'docker' | 'ci' | 'database' | 'entry' | 'api' | 'worker' | 'readme' | 'config';
  contentSnippet: string;
  size: number;
}

export interface ReportIssue {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  explanation: string;
  recommendation: string;
}

export interface TechStackItem {
  category: string;
  name: string;
  evidence: string;
}

export interface ArchitectureComponent {
  name: string;
  role: string;
  technology: string;
  evidence: string;
}

export interface StructuredReport {
  id: string;
  repoUrl: string;
  owner: string;
  repoName: string;
  analyzedAt: string;
  summary: string;
  techStack: TechStackItem[];
  architecture: {
    pattern: string;
    overview: string;
    components: ArchitectureComponent[];
    dataFlow: string[];
    asciiDiagram?: string;
  };
  apiDesign: {
    protocol: string;
    endpointsObserved: string[];
    validation: string;
    errorHandling: string;
    evidence: string;
  };
  dataLayer: {
    primaryStorage: string;
    caching: string;
    persistenceModel: string;
    evidence: string;
  };
  reliability: {
    idempotency: string;
    retriesAndBackoff: string;
    failureHandling: string;
    evidence: string;
  };
  observability: {
    logging: string;
    metrics: string;
    tracing: string;
    healthChecks: string;
    evidence: string;
  };
  security: {
    authentication: string;
    secretHandling: string;
    inputValidation: string;
    vulnerabilitiesIdentified: ReportIssue[];
  };
  scalability: {
    model: string;
    bottlenecks: string[];
    queueingObserved: string;
    evidence: string;
  };
  deployment: {
    containers: string;
    ciCd: string;
    orchestration: string;
    evidence: string;
  };
  recommendations: ReportIssue[];
  uncertainties: string[];
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  details?: string;
}

export interface WorkflowExecution {
  id: string;
  repoUrl: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStepIndex: number;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  fileRef: string;
  done: boolean;
}

export interface ImplementationChecklist {
  id: string;
  repoName: string;
  title: string;
  items: ChecklistItem[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  repoContext?: string;
  reportId?: string;
  workflowTriggered?: boolean;
  hitlPrompt?: {
    id: string;
    title: string;
    action: 'generate_checklist';
    issueCount: number;
    status: 'pending' | 'approved' | 'rejected';
  };
  checklist?: ImplementationChecklist;
}

export interface ComparisonDimension {
  name: string;
  repoAObservation: string;
  repoBObservation: string;
  verdict: string;
}

export interface RepoComparison {
  id: string;
  repoA: string;
  repoB: string;
  generatedAt: string;
  summary: string;
  dimensions: ComparisonDimension[];
  recommendations: string[];
}
