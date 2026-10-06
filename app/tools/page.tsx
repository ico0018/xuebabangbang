import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolExplorer } from "../../components/ToolExplorer";

export const metadata: Metadata = {
  title: "工具箱｜学霸帮帮",
  description: "学霸帮帮目前可用的古文、汉字和学习计划工具。",
};

export default function ToolsPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="grid gap-7 border-b border-black/15 pb-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#b84d36]">工具箱</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-[#1d1d1b] sm:text-5xl">工具不多，够用就行。</h1>
        </div>
        <p className="max-w-xl text-base leading-7 text-black/55">
          现在先把古文、汉字和学习计划这三件事做好。以后真的遇到新的学习麻烦，再往这里加。
        </p>
      </div>

      <div className="mt-9">
        <Suspense fallback={<div className="h-14 animate-pulse rounded-2xl bg-black/5" />}>
          <ToolExplorer />
        </Suspense>
      </div>
    </section>
  );
}
