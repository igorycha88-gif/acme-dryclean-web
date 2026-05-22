import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "D&A Dry Cleaning — Химчистка на дому в Москве";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#FFFFFF",
              fontFamily: "sans-serif",
            }}
          >
            D&A
          </div>
          <div
            style={{
              fontSize: "40px",
              fontWeight: 400,
              color: "#FFFFFF99",
              fontFamily: "sans-serif",
              marginLeft: "20px",
            }}
          >
            Dry Cleaning
          </div>
        </div>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            fontFamily: "sans-serif",
            lineHeight: 1.3,
          }}
        >
          Профессиональная химчистка
          <br />
          мебели на дому в Москве
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "#FFFFFF99",
            marginTop: "20px",
            fontFamily: "sans-serif",
          }}
        >
          Без предоплаты · Гарантия результата · 5 000+ заказов
        </div>
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <div
            style={{
              padding: "12px 30px",
              backgroundColor: "#3399CC",
              borderRadius: "28px",
              color: "#FFFFFF",
              fontSize: "18px",
              fontFamily: "sans-serif",
            }}
          >
            +7 (495) 226-15-73
          </div>
          <div
            style={{
              padding: "12px 30px",
              backgroundColor: "#E8453C",
              borderRadius: "28px",
              color: "#FFFFFF",
              fontSize: "18px",
              fontFamily: "sans-serif",
            }}
          >
            da-dryclean.ru
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
