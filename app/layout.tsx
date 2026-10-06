import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "学霸帮帮｜古文、汉字与学习计划小工具",
  description: "给孩子和家长准备的实用学习小工具：古文乐园、汉字花园和学习计划器。打开就用，把眼前这一小步先做好。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
