import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Thrive — Raise Your Vibration";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 80,
          background:
            "radial-gradient(at 20% 10%, rgba(167,139,250,0.5) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(244,114,182,0.4) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(251,191,36,0.25) 0px, transparent 50%), #0b0712",
          color: "#f5f1ff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.5,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #a78bfa, #f472b6, #fbbf24)",
            }}
          />
          Thrive
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 84,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: -2,
            maxWidth: 980,
          }}
        >
          The calm space where{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fbbf24 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            your future self
          </span>{" "}
          becomes inevitable.
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            color: "rgba(245,241,255,0.6)",
            maxWidth: 800,
          }}
        >
          ADHD-aware productivity, vision boards, and an AI coach in one calm,
          dopamine-friendly ecosystem.
        </div>
      </div>
    ),
    { ...size },
  );
}
