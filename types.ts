
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GALLERY = 'GALLERY',
  UPLOAD = 'UPLOAD',
  TRENDS = 'TRENDS',
  DETAILS = 'DETAILS',
  ART_TOOLS = 'ART_TOOLS'
}

// --- 1. Strict Taxonomies (The "Ground Truth" Labels) ---

export enum GameProject {
  TGM = 'The Grand Mafia',
  HC = 'Hollywood Crush',
  AA = 'Ace Alliance',
  OTHER = 'Other (其他项目)'
}

export enum PerformanceLevel {
  TOP = 'TOP (>$10k/mo)',
  STANDARD = 'Standard (>$1k/mo)',
  UNRATED = 'Unrated'
}

export enum GameGenre {
  SLG = 'SLG (策略)',
  RPG = 'RPG (角色扮演)',
  CASUAL = 'Casual (休闲)',
  PUZZLE = 'Puzzle (益智/三消)',
  SIMULATION = 'Simulation (模拟经营)',
  ACTION = 'Action (动作/射击)',
  CASINO = 'Casino (博彩/棋牌)',
  UNKNOWN = 'Unknown (其他)'
}

export enum VisualStyle {
  REALISTIC_3D = '写实 3D',
  CARTOON_2D = '欧美卡通 2D',
  ANIME = '日韩二次元',
  PIXEL = '像素风',
  LOW_POLY = '低多边形 (Low Poly)',
  MINIMALIST = '扁平极简'
}

export enum CompositionType {
  CENTERED = '中心聚焦',
  RULE_OF_THIRDS = '三分法',
  SPLIT_VS = '左右/上下对冲 (VS)',
  FIRST_PERSON = '第一人称视角',
  ISOMETRIC = '等轴测 (2.5D上帝视角)',
  GRID = '网格/宫格布局',
  UI_HEAVY = 'UI 引导主导'
}

export enum HookType {
  FAIL_RUN = '失败挽留 (Fail Run)',
  POWER_UP = '战力碾压 (Power Up)',
  BEFORE_AFTER = '逆袭/整容 (Before/After)',
  CRISIS = '生存危机 (Crisis)',
  GACHA = '抽卡爽感 (Gacha)',
  RELAX = '解压/强迫症 (ASMR/Relax)',
  MISLEADING = '玩法误导 (Misleading)',
  SOCIAL = '社交/情缘 (Social)'
}

// --- 2. Data Structures ---

export interface ColorData {
  hex: string;
  percentage: number; // 0-100
  isWarm: boolean;
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label: string;
}

export interface VisualAnalysis {
  composition: CompositionType; // Strict Enum
  mainSubject: string;
  subjectBox?: BoundingBox; // New: Object detection
  visualDensity: 'High' | 'Medium' | 'Low';
  cameraAngle: string;
  uiElements: { name: string; box?: BoundingBox }[]; // Updated: UI with locations
  realColorPalette: ColorData[]; // Extracted via Canvas
  ocrText?: string[]; // New: OCR
}

export interface MarketingAnalysis {
  hookType: HookType; // Strict Enum
  hookStrength: number; // 0-100
  emotionalTrigger: string;
  targetAudience: string;
  painPoints: string[];
  callToAction: string;
  valueProposition: string;
}

export interface ReplicationTemplate {
  visualFormula: string; // "Big Head + Red BG"
  hookBlueprint: string; // "Crisis -> Fail -> Retry"
  compositionGuide: string; // "Subject at 1/3 line"
  colorStrategy: string; // "High contrast red/blue"
}

export interface CreativeStrategy {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  adCopyVariations: { headline: string; body: string }[];
  replicationTemplate: ReplicationTemplate; // New: Template for reproduction
}

export interface AnalysisResult {
  title: string;
  project: GameProject; // New: Project Classification
  genre: GameGenre; // Strict Enum
  style: VisualStyle; // Strict Enum
  tags: string[]; // General tags
  visual: VisualAnalysis;
  marketing: MarketingAnalysis;
  strategy: CreativeStrategy;
  risk: {
    riskScore: number;
    flags: string[];
    platformCompliance: string;
  };
}

export interface Asset {
  id: string;
  url: string;
  fileName: string;
  uploadDate: string;
  notes?: string; // User notes
  performanceLevel: PerformanceLevel; // New: Manual Data Labeling
  // The "Ground Truth" computed by JS
  computedMeta: {
    width: number;
    height: number;
    dominantColors: string[]; // Hex codes
    aspectRatio: string;
  };
  analysis: AnalysisResult | null;
  embedding?: number[]; // New: Vector for similarity search
  status: 'processing' | 'completed' | 'failed';
}

export interface FilterState {
  search: string;
  projects: GameProject[];
  genres: GameGenre[];
  hooks: HookType[];
  styles: VisualStyle[];
}