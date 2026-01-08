import { Data, Effect, Schedule } from "effect";
import { parseGitHubRepoUrl } from "./github";
import type { NpmPackage } from "./types";

const REVALIDATE_SECONDS = 86400;
const REQUEST_TIMEOUT = "10 seconds" as const;

export class NpmError extends Data.TaggedError("NpmError")<{
  message: string;
}> {}

const retrySchedule = Schedule.exponential("100 millis").pipe(
  Schedule.compose(Schedule.recurs(2)),
);

export function isTypeDefinition(name: string): boolean {
  return name.startsWith("@types/") || name.startsWith("@types-");
}

export function filterPackages(names: string[]): string[] {
  return names.filter((name) => !isTypeDefinition(name));
}

function fetchPackage(name: string) {
  return Effect.tryPromise({
    try: () =>
      fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
        cache: "force-cache",
        next: { revalidate: REVALIDATE_SECONDS },
      }),
    catch: () => new NpmError({ message: "Network error" }),
  }).pipe(
    Effect.timeout(REQUEST_TIMEOUT),
    Effect.catchTag("TimeoutException", () =>
      Effect.fail(new NpmError({ message: "Request timeout" })),
    ),
    Effect.flatMap((res) => {
      if (!res.ok) {
        return Effect.fail(new NpmError({ message: `HTTP ${res.status}` }));
      }
      return Effect.tryPromise({
        try: async () => {
          const data = await res.json();
          return {
            name: data.name,
            maintainers: data.maintainers,
            repository: data.repository,
            author: data.author,
          } as NpmPackage;
        },
        catch: () => new NpmError({ message: "JSON parse error" }),
      });
    }),
    Effect.retry(retrySchedule),
    Effect.option,
  );
}

interface DownloadCount {
  downloads: number;
  package: string;
}

function fetchDownloads(name: string) {
  return Effect.tryPromise({
    try: () =>
      fetch(
        `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`,
        {
          cache: "force-cache",
          next: { revalidate: REVALIDATE_SECONDS },
        },
      ),
    catch: () => new NpmError({ message: "Network error" }),
  }).pipe(
    Effect.timeout(REQUEST_TIMEOUT),
    Effect.catchTag("TimeoutException", () =>
      Effect.fail(new NpmError({ message: "Request timeout" })),
    ),
    Effect.flatMap((res) => {
      if (!res.ok) {
        return Effect.succeed({ downloads: 0, package: name } as DownloadCount);
      }
      return Effect.tryPromise({
        try: async () => {
          const data = await res.json();
          return {
            downloads: data.downloads ?? 0,
            package: name,
          } as DownloadCount;
        },
        catch: () => new NpmError({ message: "JSON parse error" }),
      });
    }),
    Effect.orElseSucceed(
      () => ({ downloads: 0, package: name }) as DownloadCount,
    ),
  );
}

export interface PackageData {
  name: string;
  pkg: NpmPackage;
  downloads: number;
  repo: { owner: string; repo: string } | null;
}

export function fetchPackagesWithData(names: string[], concurrency = 10) {
  const effects = names.map((name) =>
    Effect.all([fetchPackage(name), fetchDownloads(name)]).pipe(
      Effect.map(([pkgOption, downloads]) => {
        if (pkgOption._tag === "None") return null;
        const pkg = pkgOption.value;
        const repoUrl = pkg.repository?.url;
        const repo = repoUrl ? parseGitHubRepoUrl(repoUrl) : null;
        return {
          name,
          pkg,
          downloads: downloads.downloads,
          repo,
        } as PackageData;
      }),
    ),
  );

  return Effect.all(effects, { concurrency }).pipe(
    Effect.map((results) =>
      results.filter((r): r is PackageData => r !== null),
    ),
  );
}

export function fetchPackages(names: string[], concurrency = 10) {
  const effects = names.map((name) =>
    fetchPackage(name).pipe(Effect.map((option) => [name, option] as const)),
  );

  return Effect.all(effects, { concurrency }).pipe(
    Effect.map((results) => {
      const map = new Map<string, NpmPackage>();
      for (const [name, option] of results) {
        if (option._tag === "Some") {
          map.set(name, option.value);
        }
      }
      return map;
    }),
  );
}

export function extractGitHubRepos(
  packages: Map<string, NpmPackage>,
): Array<{ owner: string; repo: string }> {
  const seen = new Set<string>();
  const repos: Array<{ owner: string; repo: string }> = [];

  for (const pkg of packages.values()) {
    const repoUrl = pkg.repository?.url;
    if (!repoUrl) continue;

    const parsed = parseGitHubRepoUrl(repoUrl);
    if (!parsed) continue;

    const key = `${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    repos.push(parsed);
  }

  return repos;
}
