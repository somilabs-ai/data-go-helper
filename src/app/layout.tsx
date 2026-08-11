import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "공공데이터 API 버틀러 | data.go.kr 자동 신청 & 인증키 통합 관리",
  description: "공공데이터포털(data.go.kr) Open API 검색, 1-Click 일괄 자동 신청, 발급 키 동기화 및 REST API 샌드박스 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${outfit.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
