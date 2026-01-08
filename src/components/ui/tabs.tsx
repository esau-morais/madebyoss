"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { cn } from "~/lib/utils";

type IndicatorStyle = { left: number; width: number };

export function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [activeStyle, setActiveStyle] = React.useState<IndicatorStyle | null>(
    null,
  );
  const [hoverStyle, setHoverStyle] = React.useState<IndicatorStyle | null>(
    null,
  );

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateActive = () => {
      const active = list.querySelector<HTMLElement>("[data-state=active]");
      if (active) {
        setActiveStyle({ left: active.offsetLeft, width: active.offsetWidth });
      }
    };

    updateActive();
    const observer = new MutationObserver(updateActive);
    observer.observe(list, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });
    return () => observer.disconnect();
  }, []);

  const handlePointerEnter = (e: React.PointerEvent) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-slot=tabs-trigger]",
    );
    if (trigger) {
      setHoverStyle({ left: trigger.offsetLeft, width: trigger.offsetWidth });
    }
  };

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex h-10 w-fit items-center border-b border-border",
        className,
      )}
      onPointerMove={handlePointerEnter}
      onPointerLeave={() => setHoverStyle(null)}
      {...props}
    >
      {children}
      {hoverStyle && (
        <span
          className="pointer-events-none absolute inset-y-0 bg-muted/50 transition-all duration-200"
          style={{ left: hoverStyle.left, width: hoverStyle.width }}
        />
      )}
      {activeStyle && (
        <span
          className="pointer-events-none absolute bottom-0 h-0.5 bg-accent transition-all duration-200"
          style={{ left: activeStyle.left, width: activeStyle.width }}
        />
      )}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-2 px-4 py-2 font-mono text-sm text-muted-foreground outline-none transition-colors",
        "hover:text-foreground data-[state=active]:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none data-[state=inactive]:hidden",
        className,
      )}
      forceMount
      {...props}
    />
  );
}
