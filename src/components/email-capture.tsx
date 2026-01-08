"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const GITHUB_ISSUES_URL = "https://github.com/esau-morais/madebyoss/issues";

const subscribeSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type SubscribeForm = z.infer<typeof subscribeSchema>;

export function EmailCapture() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscribeForm>({
    resolver: zodResolver(subscribeSchema),
  });

  const onSubmit = async (data: SubscribeForm) => {
    setErrorMessage(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (res.ok) {
        setStatus("success");
        reset();
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMessage(json.error || `Request failed (${res.status})`);
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        Thanks! We&apos;ll keep you posted.
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-sm text-destructive">
          {errorMessage || "Something went wrong"}
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setStatus("idle");
              setErrorMessage(null);
            }}
            variant="outline"
            size="sm"
          >
            Try again
          </Button>
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Report issue
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          className="max-w-50 font-mono text-sm"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <Button type="submit" disabled={isSubmitting} variant="outline">
          {isSubmitting ? "…" : "Notify me"}
        </Button>
      </div>
      {errors.email && (
        <p className="font-mono text-xs text-destructive">
          {errors.email.message}
        </p>
      )}
    </form>
  );
}
