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

export interface Maintainer {
  name: string;
  email?: string;
  github?: string;
  avatarUrl?: string;
  packages: string[];
}

export interface Contributor {
  login: string;
  name?: string;
  avatarUrl: string;
  contributions: number;
  repos: string[];
}

export interface AnalysisResult {
  totalPackages: number;
  totalContributors: number;
  contributors: Contributor[];
  isAnalyzing: boolean;
  error?: string;
}
