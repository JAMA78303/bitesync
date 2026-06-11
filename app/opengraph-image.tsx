import { ImageResponse } from "next/og";

export const alt = "BiteSync — plan meals to your macros";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #102818 0%, #1A4731 45%, #1f5136 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 52,
            padding: "0 80px",
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 44,
              backgroundColor: "#1A4731",
              border: "4px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 118,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            B
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span
              style={{
                fontSize: 76,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.03em",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              BiteSync
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 500,
                color: "rgba(255,255,255,0.88)",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              Plan meals to your macros
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
