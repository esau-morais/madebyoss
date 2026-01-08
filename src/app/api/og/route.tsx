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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const humans = searchParams.get("humans") || "0";
  const packages = searchParams.get("packages") || "0";
  const maintainersParam = searchParams.get("maintainers") || "";
  const maintainers = maintainersParam
    ? maintainersParam.split(",").filter(Boolean)
    : [];

  const humansCount = Number.parseInt(humans, 10) || 0;
  const remaining = Math.max(0, humansCount - 4);

  const allText = `made by${humans}humans${packages}packages+${remaining}madebyoss.com`;

  const [geistRegular, geistMono] = await Promise.all([
    loadGoogleFont("Geist", allText, 400),
    loadGoogleFont("Geist+Mono", `${humans}${packages}+${remaining}`, 700),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#09090b",
        padding: 80,
        position: "relative",
        fontFamily: "Geist",
      }}
    >
      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner frames */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 32,
          height: 32,
          borderTop: "1px solid #27272a",
          borderLeft: "1px solid #27272a",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          width: 32,
          height: 32,
          borderTop: "1px solid #27272a",
          borderRight: "1px solid #27272a",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          width: 32,
          height: 32,
          borderBottom: "1px solid #27272a",
          borderLeft: "1px solid #27272a",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          width: 32,
          height: 32,
          borderBottom: "1px solid #27272a",
          borderRight: "1px solid #27272a",
        }}
      />

      {/* Label */}
      <div
        style={{
          display: "flex",
          color: "#71717a",
          fontSize: 20,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        made by
      </div>

      {/* Main number */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          marginTop: 12,
        }}
      >
        <span
          style={{
            fontFamily: "Geist Mono",
            fontSize: 140,
            fontWeight: 700,
            color: "#fafafa",
            lineHeight: 1,
          }}
        >
          {humans}
        </span>
        <span
          style={{
            fontSize: 48,
            fontWeight: 400,
            color: "#3b82f6",
            marginLeft: 20,
            lineHeight: 1,
            paddingBottom: 14,
          }}
        >
          humans
        </span>
      </div>

      {/* Avatars */}
      <div style={{ display: "flex", gap: 12, marginTop: 48 }}>
        {maintainers.slice(0, 4).map((username) => (
          // biome-ignore lint/performance/noImgElement: ImageResponse requires native img
          <img
            key={username}
            src={`https://github.com/${encodeURIComponent(username)}.png?size=128`}
            alt=""
            width={64}
            height={64}
            style={{ border: "1px solid #27272a" }}
          />
        ))}
        {remaining > 0 && (
          <div
            style={{
              width: 64,
              height: 64,
              background: "#18181b",
              border: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Geist Mono",
              color: "#71717a",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            +{remaining}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#71717a",
            fontSize: 20,
          }}
        >
          <span style={{ fontFamily: "Geist Mono", color: "#fafafa" }}>
            {packages}
          </span>
          packages
        </span>
        <span
          style={{
            display: "flex",
            color: "#52525b",
            fontSize: 20,
            letterSpacing: "0.05em",
          }}
        >
          madebyoss.com
        </span>
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
          name: "Geist Mono",
          data: geistMono,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
