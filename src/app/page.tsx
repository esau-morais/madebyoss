import { Analyzer } from "~/components/analyzer";
import { AsciiGlobe } from "~/components/ascii-globe";
import { EmailCapture } from "~/components/email-capture";
import { NumberTicker } from "~/components/number-ticker";

function FrameCorners() {
  return (
    <>
      <span className="corner corner-tl corner-animated" />
      <span className="corner corner-tr corner-animated" />
      <span className="corner corner-bl corner-animated" />
      <span className="corner corner-br corner-animated" />
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-6 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

function Section({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <section className="relative w-full py-12 md:py-16">
      <FrameCorners />
      <div className="px-6 py-6 md:px-12 md:py-8">
        {label && <SectionLabel>{label}</SectionLabel>}
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-6 py-12 md:max-w-3xl md:px-12 md:py-24 lg:max-w-4xl">
      {/* Hero */}
      <section className="relative w-full py-12 md:py-16">
        <FrameCorners />
        <div className="flex flex-col items-center gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:gap-8 md:px-12 md:py-8">
          <div className="order-2 text-center md:order-1 md:text-left">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              AI didn&apos;t write your code.
            </h1>
            <p className="mt-2 font-mono text-3xl font-bold text-accent [word-spacing:-0.4em]! sm:text-4xl md:text-5xl">
              <NumberTicker value={312} /> humans did.
            </p>
            <p className="mt-6 max-w-md text-base text-muted-foreground md:text-lg">
              Every line of AI-assisted code stands on the shoulders of OSS
              maintainers. We make them visible again.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <AsciiGlobe />
          </div>
        </div>
      </section>

      {/* Section 1: The Invisible Workforce */}
      <Section label="The Invisible Workforce">
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            Every time AI helps you code, it draws on years of collective work.
          </p>
          <p>The tutorials. The docs. The Stack Overflow answers at 2am.</p>
          <p>
            That knowledge came from people. And right now, they&apos;re
            invisible.
          </p>
        </div>
      </Section>

      {/* Section 2: This Is Already Happening */}
      <Section label="This Is Already Happening">
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            Tailwind: 75% of their team laid off. Revenue down 80%. Despite
            millions of weekly downloads. Despite being everywhere.
          </p>
          <p>If they&apos;re struggling, imagine everyone else.</p>
          <p>
            This isn&apos;t AI&apos;s fault. It&apos;s an invisibility problem.
          </p>
        </div>
      </Section>

      {/* Section 3: We're Not Here to Guilt You */}
      <Section label="We're Not Here to Guilt You">
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>No paywall. No "please donate" banner. No "you owe them."</p>
          <p>Just visibility. See who made your stack. That&apos;s it.</p>
          <p>
            What you do with that — say thanks, support them, nothing — is up to
            you.
          </p>
        </div>
      </Section>

      {/* Section 4: Analyzer */}
      <Section label="See Your Stack">
        <p className="mb-6 text-muted-foreground">
          Paste your package.json. See the humans.
        </p>
        <Analyzer />
      </Section>

      {/* Section 5: Want to Do Something? */}
      <Section label="Want to Do Something?">
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>You don&apos;t have to. Knowing is enough.</p>
          <p>But if you want:</p>
          <ul className="space-y-2 font-mono text-sm">
            <li>
              <span className="text-foreground">Say thanks</span>{" "}
              <span className="text-muted-foreground">→</span> find them on
              Twitter/GitHub
            </li>
            <li>
              <span className="text-foreground">Support their work</span>{" "}
              <span className="text-muted-foreground">→</span> GitHub Sponsors
            </li>
            <li>
              <span className="text-foreground">Share this</span>{" "}
              <span className="text-muted-foreground">→</span> help others see
              too
            </li>
          </ul>
        </div>
      </Section>

      {/* Footer */}
      <footer className="mt-12 flex w-full flex-col items-center gap-6 border-t border-border pt-12">
        <div className="text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Want to know when we launch more features?
          </p>
          <EmailCapture />
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span>
            Built by{" "}
            <a
              href="https://x.com/mor3is_"
              className="text-foreground underline underline-offset-4 hover:text-accent"
            >
              @mor3is_
            </a>
          </span>
          <span className="text-muted-foreground">·</span>
          <a
            href="https://github.com/esau-morais/madebyoss"
            className="text-foreground underline underline-offset-4 hover:text-accent"
          >
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
