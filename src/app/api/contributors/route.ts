import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";
import { fetchContributorsForPackages } from "~/lib/github";
import { fetchPackagesWithData, filterPackages } from "~/lib/npm";
import type { AnalysisData, CategoryData } from "~/lib/types";

async function analyzeCategory(
  deps: string[],
  token: string,
): Promise<CategoryData> {
  if (deps.length === 0) {
    return { contributors: [], byPackage: [] };
  }

  const filtered = filterPackages(deps);
  if (filtered.length === 0) {
    return { contributors: [], byPackage: [] };
  }

  const program = Effect.gen(function* () {
    const packages = yield* fetchPackagesWithData(filtered, 10);
    const packagesWithRepos = packages.filter((p) => p.repo !== null);

    if (packagesWithRepos.length === 0) {
      return { contributors: [], byPackage: [] };
    }

    return yield* fetchContributorsForPackages(packagesWithRepos, token);
  });

  return Effect.runPromise(program);
}

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
    const dependencies: string[] = body.dependencies ?? [];
    const devDependencies: string[] = body.devDependencies ?? [];

    if (dependencies.length === 0 && devDependencies.length === 0) {
      return NextResponse.json(
        { error: "No dependencies provided" },
        { status: 400 },
      );
    }

    const [stack, tools] = await Promise.all([
      analyzeCategory(dependencies, token),
      analyzeCategory(devDependencies, token),
    ]);

    const uniqueStackHumans = new Set(stack.contributors.map((c) => c.login));
    const uniqueToolsHumans = new Set(tools.contributors.map((c) => c.login));
    const uniqueTotalHumans = new Set([
      ...uniqueStackHumans,
      ...uniqueToolsHumans,
    ]);

    const result: AnalysisData = {
      summary: {
        totalHumans: uniqueTotalHumans.size,
        stackHumans: uniqueStackHumans.size,
        toolsHumans: uniqueToolsHumans.size,
        stackPackages: filterPackages(dependencies).length,
        toolsPackages: filterPackages(devDependencies).length,
      },
      stack: {
        contributors: stack.contributors,
        byPackage: stack.byPackage,
      },
      tools: {
        contributors: tools.contributors,
        byPackage: tools.byPackage,
      },
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contributors" },
      { status: 500 },
    );
  }
}
