import { ImageResponse } from "next/og";

/** PNG favicon — SVG tabs break on Safari; this route serves universal favicons. */
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 11,
        }}
      >
        <span
          style={{
            fontSize: 30,
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
