import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1A4731",
          borderRadius: 38,
        }}
      >
        <span
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: "#FFFFFF",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          B
        </span>
      </div>
    ),
    { ...size },
  );
}
