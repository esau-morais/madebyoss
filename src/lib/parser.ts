import type { ParsedDependencies } from "./types";

export function parsePackageJson(content: string): ParsedDependencies {
  const pkg = JSON.parse(content);
  const dependencies = Object.keys(pkg.dependencies || {});
  const devDependencies = Object.keys(pkg.devDependencies || {});
  return {
    dependencies,
    devDependencies,
    all: [...new Set([...dependencies, ...devDependencies])],
  };
}
