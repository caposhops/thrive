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
          background:
            "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fbbf24 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3c2.2 3 3 5.8 3 8.2 0 .9-.1 1.7-.3 2.4 1.8-.6 3.6-2 5.3-4.2-.3 4.1-2.5 7.3-5.3 8.8 1.4.6 3 .8 4.9.6-2 2.6-5 4-8.6 4-3.6 0-6.6-1.4-8.6-4 1.9.2 3.5 0 4.9-.6C4.5 16.7 2.3 13.5 2 9.4c1.7 2.2 3.5 3.6 5.3 4.2-.2-.7-.3-1.5-.3-2.4C7 8.8 7.8 6 10 3l1 1.5L12 3z"
            fill="#0b0712"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
