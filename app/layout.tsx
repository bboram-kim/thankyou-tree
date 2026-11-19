import type { Metadata } from "next";
import { Geist_Mono, Nanum_Gothic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const nanumGothic = Nanum_Gothic({
  weight: ["400", "700", "800"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thank You Tree",
  description: "링크를 받은 사람들이 사진 오너먼트와 감사 한 줄을 달아 주는 연말 Thank You Tree",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", nanumGothic.variable)}
    >
      <body className="min-h-full flex flex-col">
        {/* 공통 shell: 폭, 좌우 여백, 화면 간격은 여기서만 정한다. */}
        <main className="mx-auto break-keep flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4 pb-6">
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
