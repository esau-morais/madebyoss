import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

async function loadGoogleFont(font: string, text: string, weight = 400) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data");
}

const COLORS = {
  bg: "#09090b",
  fg: "#fafafa",
  accent: "#3b82f6",
  border: "#27272a",
  muted: "#71717a",
};

function LogoSVG({
  size,
  frameColor = COLORS.fg,
}: {
  size: number;
  frameColor?: string;
}) {
  const stroke = Math.max(2, size * 0.04);
  const corner = size * 0.28;
  const dotSize = size * 0.14;
  const padding = size * 0.18;

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: OG image generation
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ background: COLORS.bg }}
    >
      {/* Top-left corner */}
      <path
        d={`M ${padding} ${padding + corner} L ${padding} ${padding} L ${padding + corner} ${padding}`}
        stroke={frameColor}
        strokeWidth={stroke}
        fill="none"
      />
      {/* Top-right corner */}
      <path
        d={`M ${size - padding - corner} ${padding} L ${size - padding} ${padding} L ${size - padding} ${padding + corner}`}
        stroke={frameColor}
        strokeWidth={stroke}
        fill="none"
      />
      {/* Bottom-left corner */}
      <path
        d={`M ${padding} ${size - padding - corner} L ${padding} ${size - padding} L ${padding + corner} ${size - padding}`}
        stroke={frameColor}
        strokeWidth={stroke}
        fill="none"
      />
      {/* Bottom-right corner */}
      <path
        d={`M ${size - padding - corner} ${size - padding} L ${size - padding} ${size - padding} L ${size - padding} ${size - padding - corner}`}
        stroke={frameColor}
        strokeWidth={stroke}
        fill="none"
      />
      {/* Center dot */}
      <rect
        x={(size - dotSize) / 2}
        y={(size - dotSize) / 2}
        width={dotSize}
        height={dotSize}
        fill={COLORS.accent}
      />
    </svg>
  );
}

function generateLogo(size: number) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        background: COLORS.bg,
      }}
    >
      <LogoSVG size={size} />
    </div>,
    {
      width: size,
      height: size,
    },
  );
}

async function generateOG() {
  const text = "madebyoss.comAI didn't write your code.humans did.";
  const [geistRegular, geistBold] = await Promise.all([
    loadGoogleFont("Geist", text, 400),
    loadGoogleFont("Geist", text, 700),
  ]);

  const logoSize = 56;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: COLORS.bg,
        padding: 80,
        fontFamily: "Geist",
      }}
    >
      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          gap: 32,
        }}
      >
        {/* Logo mark inline with brand name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <LogoSVG size={logoSize} />
          <span
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: COLORS.muted,
              letterSpacing: "0.02em",
            }}
          >
            madebyoss.com
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.fg,
              lineHeight: 1.15,
            }}
          >
            AI didn't write your code.
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.accent,
              lineHeight: 1.15,
            }}
          >
            humans did.
          </span>
        </div>
      </div>

      {/* Footer dots */}
      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <div style={{ width: 8, height: 8, background: COLORS.border }} />
        <div style={{ width: 8, height: 8, background: COLORS.border }} />
        <div style={{ width: 8, height: 8, background: COLORS.border }} />
        <div style={{ width: 8, height: 8, background: COLORS.border }} />
        <div style={{ width: 8, height: 8, background: COLORS.accent }} />
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Geist",
          data: geistRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Geist",
          data: geistBold,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

async function generateLogoWithText(height: number) {
  const text = "madebyoss";
  const [geistMedium] = await Promise.all([loadGoogleFont("Geist", text, 500)]);

  const markSize = height * 0.65;
  const fontSize = height * 0.26;
  const width = height * 3.5;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width,
        height,
        background: COLORS.bg,
        paddingLeft: height * 0.12,
        paddingRight: height * 0.12,
        gap: height * 0.15,
        fontFamily: "Geist",
      }}
    >
      <LogoSVG size={markSize} />
      <span
        style={{
          fontSize,
          fontWeight: 500,
          color: COLORS.fg,
          letterSpacing: "-0.01em",
        }}
      >
        madebyoss
      </span>
    </div>,
    {
      width,
      height,
      fonts: [
        {
          name: "Geist",
          data: geistMedium,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "logo";
  const size = Number.parseInt(searchParams.get("size") || "512", 10);

  switch (type) {
    case "logo":
      return generateLogo(Math.min(size, 1024));
    case "logo-text":
      return generateLogoWithText(Math.min(size, 256));
    case "og":
      return generateOG();
    case "favicon":
      return generateLogo(32);
    default:
      return generateLogo(512);
  }
}
