export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GALLERY = 'GALLERY',
  UPLOAD = 'UPLOAD',
  TRENDS = 'TRENDS',
  DETAILS = 'DETAILS'
}

export interface VisualAnalysis {
  composition: string;
  mainSubject: string;
  colorPalette: string[];
  lighting: string;
  cameraAngle: string;
  sceneDescription: string; // New: Narrative description
  visualHierarchy: string; // New: What draws the eye first, second, third
}

export interface MarketingAnalysis {
  hookType: string;
  emotionalTrigger: string;
  targetAudience: string;
  painPoints: string[];
  valueProposition: string;
  callToAction: string; // New: The implied CTA
}

export interface CreativeStrategy {
  score: number; // 0-100 effectiveness score
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[]; // New: How to make it better
  adCopyVariations: { headline: string; body: string }[]; // New: AI suggested text
  variantIdeas: string[]; // New: Ideas for A/B testing
}

export interface RiskAssessment {
  riskScore: number;
  flags: string[];
  platformCompliance: string;
}

export interface AnalysisResult {
  title: string;
  genre: string;
  style: string;
  tags: { category: string; value: string }[]; // Expanded structure
  visual: VisualAnalysis;
  marketing: MarketingAnalysis;
  strategy: CreativeStrategy; // New Section
  risk: RiskAssessment;
  replicationPrompt: string;
}

export interface Asset {
  id: string;
  url: string;
  fileName: string;
  uploadDate: string;
  analysis: AnalysisResult | null;
  status: 'processing' | 'completed' | 'failed';
}

export interface FilterState {
  search: string;
  genre: string | '全部';
  hook: string | '全部';
}