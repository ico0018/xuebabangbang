import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolExplorer } from "../../components/ToolExplorer";

export const metadata: Metadata = {
  title: "学习工具箱 - 学霸帮帮",
  description: "浏览学霸帮帮为小学生和家长准备的实用学习工具。",
};

export default function ToolsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="max-w-2xl"><p className="text-sm font-semibold text-sky">学习工具箱</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">挑一个小工具，马上开始学习。</h1><p className="mt-4 leading-7 text-slate-600">按学科浏览，或直接搜索你想找的工具。</p></div>
      <div className="mt-9"><Suspense fallback={<div className="h-14 animate-pulse rounded-xl bg-slate-100" />}><ToolExplorer /></Suspense></div>
    </section>
  );
}
