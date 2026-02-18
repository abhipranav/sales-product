import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VelocityOS preview";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(130deg, #f7f1df 0%, #e7dcc1 45%, #f4e8cc 100%)",
          border: "8px solid #111111",
          padding: "56px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "30px", height: "30px", background: "#111111" }} />
          <div
            style={{
              fontSize: "22px",
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: "#111111"
            }}
          >
            VELOCITY_OS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <div
            style={{
              fontSize: "72px",
              lineHeight: 1,
              fontWeight: 800,
              color: "#111111"
            }}
          >
            AI Sales Execution
          </div>
          <div
            style={{
              fontSize: "30px",
              lineHeight: 1.25,
              color: "#242424"
            }}
          >
            Pipeline control, signal intelligence, and human-approved outbound workflows.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "18px",
            color: "#2c2c2c"
          }}
        >
          <div>workspace • cockpit • workflows • integrations</div>
          <div style={{ border: "2px solid #111111", padding: "8px 12px", fontWeight: 700 }}>
            LIVE READY
          </div>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
