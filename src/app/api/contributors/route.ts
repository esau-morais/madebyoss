import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";
import { fetchContributorsForRepos } from "~/lib/github";
import { extractGitHubRepos, fetchPackages } from "~/lib/npm";

export async function POST(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const dependencies: string[] = body.dependencies;

    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return NextResponse.json(
        { error: "No dependencies provided" },
        { status: 400 },
      );
    }

    const program = Effect.gen(function* () {
      const packages = yield* fetchPackages(dependencies, 10);
      const repos = extractGitHubRepos(packages);

      if (repos.length === 0) {
        return {
          contributors: [],
          totalPackages: packages.size,
          totalRepos: 0,
        };
      }

      const contributors = yield* fetchContributorsForRepos(repos, token);

      return {
        contributors,
        totalPackages: packages.size,
        totalRepos: repos.length,
      };
    });

    const result = await Effect.runPromise(program);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contributors" },
      { status: 500 },
    );
  }
}
