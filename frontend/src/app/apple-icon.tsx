import { ImageResponse } from "next/og";

export const runtime = "edge";
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A1F44",
          borderRadius: "36px",
        }}
      >
        <span
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          D&A
        </span>
        <span
          style={{
            fontSize: "14px",
            color: "#FFFFFF99",
            fontFamily: "sans-serif",
            marginTop: "4px",
          }}
        >
          Dry Cleaning
        </span>
      </div>
    ),
    { ...size }
  );
}
