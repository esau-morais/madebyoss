"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { parsePackageJson } from "~/lib/parser";
import type { AnalysisResult, Contributor } from "~/lib/types";

function ContributorAvatar({ contributor }: { contributor: Contributor }) {
  return (
    <div className="flex w-20 flex-col items-center gap-2">
      {/* biome-ignore lint/performance/noImgElement: dynamic external avatars */}
      <img
        src={contributor.avatarUrl}
        alt=""
        aria-hidden="true"
        className="size-16 border border-border"
        loading="lazy"
      />
      <span className="max-w-20 truncate font-mono text-xs text-muted-foreground">
        {contributor.name || contributor.login}
      </span>
    </div>
  );
}

function ContributorAvatarSkeleton() {
  return (
    <div className="flex w-20 flex-col items-center gap-2">
      <Skeleton className="size-16 rounded-none" />
      <Skeleton className="h-3 w-14 rounded-none" />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Your stack is made by
        </p>
        <div className="mt-2 flex justify-center">
          <Skeleton className="h-16 w-24 rounded-none md:h-10" />
        </div>
        <p className="font-mono text-sm text-muted-foreground">humans</p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        <ContributorAvatarSkeleton />
        <ContributorAvatarSkeleton />
        <ContributorAvatarSkeleton />
        <ContributorAvatarSkeleton />
        <div className="flex w-20 flex-col items-center gap-2">
          <Skeleton className="size-16 rounded-none" />
          <span className="font-mono text-xs text-transparent">_</span>
        </div>
      </div>

      <Skeleton className="h-5 w-36 rounded-none" />

      <Skeleton className="mt-6 h-9 w-48 rounded-none" />
    </div>
  );
}

function Results({ result }: { result: AnalysisResult }) {
  const topContributors = result.contributors.slice(0, 4);
  const remaining = result.totalContributors - 4;

  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Your stack is made by
        </p>
        <p className="mt-2 font-mono text-6xl font-bold tracking-tight md:text-7xl">
          {result.totalContributors}
        </p>
        <p className="font-mono text-sm text-muted-foreground">humans</p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        {topContributors.map((c) => (
          <ContributorAvatar key={c.login} contributor={c} />
        ))}
        {remaining > 0 && (
          <div className="flex w-20 flex-col items-center gap-2">
            <div className="flex size-16 items-center justify-center border border-border bg-secondary font-mono text-sm text-muted-foreground">
              +{remaining}
            </div>
            <span className="font-mono text-xs text-transparent">_</span>
          </div>
        )}
      </div>

      <p className="font-mono text-sm text-muted-foreground">
        across {result.totalPackages} packages
      </p>

      <Button
        onClick={() => {
          const contributorNames = result.contributors
            .slice(0, 4)
            .map((c) => c.login)
            .join(",");
          const url = `/api/og?humans=${result.totalContributors}&packages=${result.totalPackages}&maintainers=${encodeURIComponent(contributorNames)}`;
          window.open(url, "_blank");
        }}
        variant="outline"
        className="mt-6"
      >
        Generate shareable card
      </Button>
    </div>
  );
}

export function Analyzer() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const cacheRef = useRef<Map<string, AnalysisResult>>(new Map());

  const dependencies = useMemo(() => {
    try {
      return parsePackageJson(input).all;
    } catch {
      return [];
    }
  }, [input]);

  const cacheKey = useMemo(
    () =>
      dependencies.length > 0 ? dependencies.slice().sort().join(",") : "",
    [dependencies],
  );

  const analyze = async () => {
    if (dependencies.length === 0) {
      setResult({
        totalPackages: 0,
        totalContributors: 0,
        contributors: [],
        isAnalyzing: false,
        error: "No dependencies found",
      });
      return;
    }

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResult(cached);
      return;
    }

    setResult({
      totalPackages: dependencies.length,
      totalContributors: 0,
      contributors: [],
      isAnalyzing: true,
    });

    try {
      const res = await fetch("/api/contributors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependencies }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch contributors");
      }

      const data = await res.json();

      const newResult: AnalysisResult = {
        totalPackages: data.totalPackages,
        totalContributors: data.contributors.length,
        contributors: data.contributors,
        isAnalyzing: false,
      };

      cacheRef.current.set(cacheKey, newResult);
      setResult(newResult);
    } catch (err) {
      setResult({
        totalPackages: 0,
        totalContributors: 0,
        contributors: [],
        isAnalyzing: false,
        error:
          err instanceof Error ? err.message : "Invalid package.json format",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="liquid-metal">
        <Textarea
          placeholder="Paste your package.json here…"
          className="h-50 bg-background font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <Button
        onClick={analyze}
        className="mt-6 w-full"
        disabled={!input.trim() || result?.isAnalyzing}
      >
        {result?.isAnalyzing ? "Analyzing…" : "See the humans"}
      </Button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{
          gridTemplateRows: result?.error ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <p className="pt-6 text-center font-mono text-sm text-destructive">
            {result?.error}
          </p>
        </div>
      </div>

      {result?.isAnalyzing && <ResultsSkeleton />}

      {result && !result.isAnalyzing && !result.error && (
        <Results result={result} />
      )}
    </div>
  );
}
