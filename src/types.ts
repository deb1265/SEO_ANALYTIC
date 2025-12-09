
export interface ApiSettings {
  openRouterKey: string;
  dataForSeoLogin: string;
  dataForSeoPassword: string;
  aiModel: string;
  vercelToken: string;
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  status: string;
  currentStep: string;
}

export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
}

export interface ImageData {
  src: string;
  alt: string;
  hasAlt: boolean;
}

export interface LinkData {
  href: string;
  text: string;
}

export interface ExtractedContent {
  url: string;
  domain: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  headings: HeadingStructure;
  bodyText: string;
  paragraphs: string[];
  wordCount: number;
  first100Words: string;
  images: ImageData[];
  internalLinks: LinkData[];
  externalLinks: LinkData[];
  canonical: string;
  viewport: string;
  robots: string;
  ogTitle: string;
  ogDesc: string;
  twitterCard: string;
  lang: string;
  schemas: string[];
  isHttps: boolean;
  urlLength: number;
}

export interface CategoryScore {
  score: number;
  passed: string[];
  failed: string[];
}

export interface Scores {
  onPage: CategoryScore;
  keywords: CategoryScore;
  technical: CategoryScore;
  uxMobile: CategoryScore;
}

export interface KeywordData {
  word: string;
  count: number;
  density: string;
}

export interface ContentQuality {
  readabilityScore: number;
  uniquenessScore: number;
  depthScore: number;
}

export interface TechnicalEstimates {
  fcp: string;
  lcp: string;
  cls: string;
  tti: string;
}

export interface Recommendation {
  priority: 'critical' | 'warning' | 'opportunity';
  title: string;
  description: string;
  suggestion: string;
  impact: string;
}

export interface AIAnalysis {
  overallScore: number;
  confidence: number;
  scores: Scores;
  primaryKeywords: KeywordData[];
  suggestedKeywords: string[];
  contentQuality: ContentQuality;
  technicalEstimates: TechnicalEstimates;
  summary: string;
  keywordAnalysis: string;
  recommendations: Recommendation[];
  optimizedTitle: string;
  optimizedMetaDescription: string;
  contentImprovements: string[];
  industryComparison: string;
  sectionReplacements?: SectionReplacement[];
}

export interface SectionReplacement {
  sectionType: string;
  original: string;
  optimized: string;
  reasoning: string;
}

export interface AnalysisData extends ExtractedContent {
  aiAnalysis: AIAnalysis;
  analyzedAt: string;
  keywordSuggestions?: string[];
}

export interface ContentSection {
  type: 'title' | 'meta' | 'h1' | 'h2' | 'h3' | 'paragraph' | 'custom';
  content: string;
  index?: number;
  label: string;
}

export interface VercelEnvVar {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type: 'plain' | 'secret' | 'encrypted';
}

export interface VercelFile {
  name: string;
  content: string;
  type: string;
}

export interface DeploymentStatus {
  status: 'idle' | 'uploading' | 'building' | 'deploying' | 'ready' | 'error';
  message: string;
  url?: string;
  projectId?: string;
  deploymentId?: string;
}
