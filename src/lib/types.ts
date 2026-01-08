export interface ParsedDependencies {
  dependencies: string[];
  devDependencies: string[];
  all: string[];
}

export interface NpmMaintainer {
  name: string;
  email?: string;
}

export interface NpmPackage {
  name: string;
  maintainers?: NpmMaintainer[];
  repository?: { url?: string };
  author?: { name?: string; email?: string };
}

export interface Contributor {
  login: string;
  name?: string;
  avatarUrl: string;
  contributions: number;
  score: number;
  repos: string[];
}

export interface PackageContributors {
  name: string;
  downloads: number;
  contributors: Contributor[];
  totalContributors: number;
}

export interface CategoryData {
  contributors: Contributor[];
  byPackage: PackageContributors[];
}

export interface AnalysisSummary {
  totalHumans: number;
  stackHumans: number;
  toolsHumans: number;
  stackPackages: number;
  toolsPackages: number;
}

export interface AnalysisData {
  summary: AnalysisSummary;
  stack: CategoryData;
  tools: CategoryData;
}

export interface AnalysisResult {
  data: AnalysisData | null;
  isAnalyzing: boolean;
  error?: string;
}
