export type TaskStatus = "todo" | "in_progress" | "done";
export interface ReportTask {
  id: string;
  title: string;
  priority: string;
  status: TaskStatus;
  dueDate: string;
  notes: string;
}
export interface Ranking {
  id: string;
  keyword: string;
  date: string;
  position: number;
  source: string;
}
export interface PageFinding {
  url: string;
  title: string;
  description: string;
  h1: string[];
  score: number;
  scores: import("../types.js").Scores;
  wordCount: number;
  images: number;
  missingAlt: number;
  canonical: string;
  robots: string;
  schemas: string[];
  checks: any[];
  terms: { word: string; count: number; density: string }[];
  status: number;
  fetchMs: number;
  bodyExcerpt: string;
  internalLinks?: string[];
}
export interface ResearchSource {
  url: string;
  title: string;
}
export interface Strategy {
  summary: string;
  strengths: string[];
  risks: string[];
  competitors: {
    name: string;
    url: string;
    whyRelevant: string;
    strength: string;
    opportunity: string;
    sourceUrl: string;
  }[];
  keywordPlan: {
    keyword: string;
    intent: string;
    priority: string;
    cluster: string;
    targetPage: string;
    action: string;
    reasoning: string;
  }[];
  issues: {
    title: string;
    severity: string;
    category: string;
    evidence: string;
    suggestion: string;
    effort: string;
    sourceUrl: string;
  }[];
  contentPlan: {
    title: string;
    primaryKeyword: string;
    pageType: string;
    outline: string[];
    cta: string;
  }[];
  roadmap: {
    phase: string;
    title: string;
    actions: string[];
    successMetric: string;
  }[];
  optimized: { title: string; metaDescription: string; h1: string };
}
export interface SeoReport {
  id: string;
  revision: number;
  client: string;
  url: string;
  location: string;
  focus: string;
  createdAt: string;
  updatedAt: string;
  state: "draft" | "reviewed" | "delivered";
  pages: PageFinding[];
  warnings: string[];
  technical: {
    robotsUrl: string;
    robotsStatus: number | null;
    sitemapUrl: string;
    sitemapStatus: number | null;
    robotsNotes: string[];
  };
  strategy: Strategy | null;
  sources: ResearchSource[];
  model: string;
  aiStatus: string;
  aiCost: number | null;
  tasks: ReportTask[];
  rankings: Ranking[];
  agency: string;
  preparedBy: string;
  fee: number | null;
  currency: string;
  notes: string;
}
