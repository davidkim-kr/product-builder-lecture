import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "인테리어 시뮬레이터 | AI 가구 배치",
  description: "AI 기반 인테리어 시뮬레이션 - 중고 가구를 구매 전 내 방에 미리 배치해보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
