import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "学霸帮帮｜古文乐园、汉字乐园、作文帮帮与任务小帮手",
  description:
    "选一个小工具开始：古文听读与默写、汉字笔顺与听写、作文素材与思路、学习任务与自检。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
