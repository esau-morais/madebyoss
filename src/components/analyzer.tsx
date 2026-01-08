"use client";

import { useMemo, useRef, useState } from "react";
import { NumberTicker } from "~/components/number-ticker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { parsePackageJson } from "~/lib/parser";
import type {
  AnalysisData,
  AnalysisResult,
  CategoryData,
  Contributor,
  PackageContributors,
} from "~/lib/types";
import { cn } from "~/lib/utils";

function formatDownloads(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function ContributorAvatar({
  contributor,
  size = "md",
}: {
  contributor: Contributor;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-10" : "size-16";
  const textClass = size === "sm" ? "max-w-10 text-[10px]" : "max-w-20 text-xs";
  const containerClass = size === "sm" ? "w-10" : "w-20";

  return (
    <div className={cn("flex flex-col items-center gap-1", containerClass)}>
      {/* biome-ignore lint/performance/noImgElement: dynamic external avatars */}
      <img
        src={contributor.avatarUrl}
        alt=""
        aria-hidden="true"
        className={cn("border border-border", sizeClass)}
        loading="lazy"
      />
      <span
        className={cn("truncate font-mono text-muted-foreground", textClass)}
      >
        {contributor.name || contributor.login}
      </span>
    </div>
  );
}

function AnalyzingState({ packageCount }: { packageCount: number }) {
  return (
    <div className="mt-12 flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="flex gap-1">
        <span className="size-2 animate-pulse bg-accent [animation-delay:0ms]" />
        <span className="size-2 animate-pulse bg-accent [animation-delay:150ms]" />
        <span className="size-2 animate-pulse bg-accent [animation-delay:300ms]" />
      </div>
      <p className="font-mono text-sm text-muted-foreground">
        Analyzing {packageCount} packages…
      </p>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageContributors }) {
  const topContributors = pkg.contributors.slice(0, 4);
  const remaining = pkg.totalContributors - 4;

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-foreground">{pkg.name}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatDownloads(pkg.downloads)}/wk
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {topContributors.map((c) => (
          <ContributorAvatar key={c.login} contributor={c} size="sm" />
        ))}
        {remaining > 0 && (
          <div className="flex size-10 items-center justify-center border border-border bg-secondary font-mono text-xs text-muted-foreground">
            +{remaining}
          </div>
        )}
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {pkg.totalContributors} contributors
      </p>
    </div>
  );
}

function PackageBreakdown({ packages }: { packages: PackageContributors[] }) {
  if (packages.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="packages" className="border-b-0">
        <AccordionTrigger>See by package</AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.map((pkg) => (
              <PackageCard key={pkg.name} pkg={pkg} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function CategoryResults({
  data,
  label,
  packagesLabel,
  onGenerateCard,
}: {
  data: CategoryData;
  label: string;
  packagesLabel: string;
  onGenerateCard: () => void;
}) {
  const topContributors = data.contributors.slice(0, 4);
  const remaining = data.contributors.length - 4;

  if (data.contributors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          No{" "}
          {label.toLowerCase().replace("your ", "").replace(" is made by", "")}{" "}
          found
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-mono text-6xl font-bold tracking-tight md:text-7xl">
          <NumberTicker value={data.contributors.length} />
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

      <p className="font-mono text-sm text-muted-foreground">{packagesLabel}</p>

      <Button onClick={onGenerateCard} variant="outline">
        Generate shareable card
      </Button>

      <PackageBreakdown packages={data.byPackage} />
    </div>
  );
}

function Results({ data }: { data: AnalysisData }) {
  const [activeTab, setActiveTab] = useState("stack");

  const handleGenerateCard = (tab: string) => {
    const category = tab === "stack" ? data.stack : data.tools;
    const contributorNames = category.contributors
      .slice(0, 4)
      .map((c) => c.login)
      .join(",");
    const humans =
      tab === "stack" ? data.summary.stackHumans : data.summary.toolsHumans;
    const packages =
      tab === "stack" ? data.summary.stackPackages : data.summary.toolsPackages;
    const url = `/api/og?humans=${humans}&packages=${packages}&maintainers=${encodeURIComponent(contributorNames)}&type=${tab}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mt-12 flex flex-col items-center">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col items-center"
      >
        <TabsList>
          <TabsTrigger value="stack">
            Stack{" "}
            <span className="text-xs text-accent">
              {data.summary.stackHumans}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tools">
            Tools{" "}
            <span className="text-xs text-accent">
              {data.summary.toolsHumans}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stack" className="mt-8">
          <CategoryResults
            data={data.stack}
            label="Your stack is made by"
            packagesLabel={`across ${data.summary.stackPackages} packages`}
            onGenerateCard={() => handleGenerateCard("stack")}
          />
        </TabsContent>

        <TabsContent value="tools" className="mt-8">
          <CategoryResults
            data={data.tools}
            label="Your tools are made by"
            packagesLabel={`across ${data.summary.toolsPackages} packages`}
            onGenerateCard={() => handleGenerateCard("tools")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Analyzer() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const cacheRef = useRef<Map<string, AnalysisData>>(new Map());

  const parsed = useMemo(() => {
    try {
      return parsePackageJson(input);
    } catch {
      return null;
    }
  }, [input]);

  const cacheKey = useMemo(() => {
    if (!parsed) return "";
    const all = [...parsed.dependencies, ...parsed.devDependencies].sort();
    return all.join(",");
  }, [parsed]);

  const analyze = async () => {
    if (
      !parsed ||
      (parsed.dependencies.length === 0 && parsed.devDependencies.length === 0)
    ) {
      setResult({
        data: null,
        isAnalyzing: false,
        error: "No dependencies found",
      });
      return;
    }

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResult({ data: cached, isAnalyzing: false });
      return;
    }

    setResult({ data: null, isAnalyzing: true });

    try {
      const res = await fetch("/api/contributors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dependencies: parsed.dependencies,
          devDependencies: parsed.devDependencies,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch contributors");
      }

      const data: AnalysisData = await res.json();
      cacheRef.current.set(cacheKey, data);
      setResult({ data, isAnalyzing: false });
    } catch (err) {
      setResult({
        data: null,
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

      {result?.isAnalyzing && parsed && (
        <AnalyzingState
          packageCount={
            parsed.dependencies.length + parsed.devDependencies.length
          }
        />
      )}

      {result?.data && !result.isAnalyzing && <Results data={result.data} />}
    </div>
  );
}
