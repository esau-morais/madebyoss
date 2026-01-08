import { Data, Effect, Schedule } from "effect";
import type { Contributor } from "./types";

const API_VERSION = "2022-11-28";
const GITHUB_API_BASE = "https://api.github.com";
const REVALIDATE_SECONDS = 86400;
const REQUEST_TIMEOUT = "10 seconds" as const;

interface GitHubContributor {
  login: string;
  avatar_url: string;
  type: "User" | "Organization" | "Bot";
  contributions: number;
}

export class GitHubError extends Data.TaggedError("GitHubError")<{
  status: number;
  message: string;
}> {}

export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  retryAfter?: number;
}> {}

type FetchError = GitHubError | RateLimitError;

function getHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": API_VERSION,
  };
}

const retrySchedule = Schedule.exponential("100 millis").pipe(
  Schedule.compose(Schedule.recurs(3)),
);

function fetchRepoContributors(
  owner: string,
  repo: string,
  token: string,
  perPage = 100,
) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=${perPage}`;

  return Effect.tryPromise({
    try: () =>
      fetch(url, {
        headers: getHeaders(token),
        cache: "force-cache",
        next: { revalidate: REVALIDATE_SECONDS },
      }),
    catch: () => new GitHubError({ status: 0, message: "Network error" }),
  }).pipe(
    Effect.timeout(REQUEST_TIMEOUT),
    Effect.catchTag("TimeoutException", () =>
      Effect.fail(new GitHubError({ status: 408, message: "Request timeout" })),
    ),
    Effect.flatMap((res): Effect.Effect<GitHubContributor[], FetchError> => {
      if (res.status === 403 || res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        return Effect.fail(
          new RateLimitError({
            retryAfter: retryAfter
              ? Number.parseInt(retryAfter, 10)
              : undefined,
          }),
        );
      }
      if (res.status === 404 || res.status === 204) {
        return Effect.succeed([]);
      }
      if (!res.ok) {
        return Effect.fail(
          new GitHubError({
            status: res.status,
            message: `HTTP ${res.status}`,
          }),
        );
      }
      return Effect.tryPromise({
        try: () => res.json() as Promise<GitHubContributor[]>,
        catch: () =>
          new GitHubError({ status: 0, message: "JSON parse error" }),
      });
    }),
    Effect.retry(retrySchedule),
    Effect.orElseSucceed(() => [] as GitHubContributor[]),
  );
}

export function parseGitHubRepoUrl(
  url: string,
): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/i,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

export function fetchContributorsForRepos(
  repos: Array<{ owner: string; repo: string }>,
  token: string,
  { concurrency = 5, maxRepos = 50 } = {},
): Effect.Effect<Contributor[]> {
  const limitedRepos = repos.slice(0, maxRepos);

  const effects = limitedRepos.map(({ owner, repo }) =>
    fetchRepoContributors(owner, repo, token).pipe(
      Effect.map((contributors) => ({
        repoKey: `${owner}/${repo}`,
        contributors,
      })),
    ),
  );

  return Effect.all(effects, { concurrency }).pipe(
    Effect.map((results) => {
      const contributorMap = new Map<
        string,
        {
          avatarUrl: string;
          contributions: number;
          repos: Set<string>;
        }
      >();

      for (const { repoKey, contributors } of results) {
        for (const c of contributors) {
          if (c.type !== "User") continue;

          const existing = contributorMap.get(c.login);
          if (existing) {
            existing.contributions += c.contributions;
            existing.repos.add(repoKey);
          } else {
            contributorMap.set(c.login, {
              avatarUrl: c.avatar_url,
              contributions: c.contributions,
              repos: new Set([repoKey]),
            });
          }
        }
      }

      return Array.from(contributorMap.entries())
        .map(([login, data]) => ({
          login,
          avatarUrl: data.avatarUrl,
          contributions: data.contributions,
          repos: Array.from(data.repos),
        }))
        .sort((a, b) => b.contributions - a.contributions);
    }),
  );
}
