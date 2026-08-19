import Link from "next/link";
import { CategoryCard } from "../components/CategoryCard";
import { Hero } from "../components/Hero";
import { ToolGrid } from "../components/ToolGrid";
import { tools } from "../data/tools";

const categories = [
  { category: "chinese" as const, title: "语文", description: "识字、拼音、阅读等工具", accent: "bg-leaf" },
  { category: "math" as const, title: "数学", description: "口算、计算、数学练习", accent: "bg-sky" },
  { category: "english" as const, title: "英语", description: "单词、阅读、英语学习", accent: "bg-butter" },
  { category: "general" as const, title: "通用", description: "学习效率和实用小工具", accent: "bg-violet-400" },
];

export default function HomePage() {
  const featuredTools = tools.filter((tool) => tool.featured);

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div><h2 className="text-2xl font-bold tracking-tight text-ink">热门工具</h2><p className="mt-2 text-slate-600">从一个小工具开始，让学习更轻松。</p></div>
          <Link href="/tools" className="hidden text-sm font-semibold text-sky hover:text-[#3f80b2] sm:inline-block">全部工具 →</Link>
        </div>
        <div className="mt-8"><ToolGrid tools={featuredTools} /></div>
        <Link href="/tools" className="mt-6 inline-block text-sm font-semibold text-sky hover:text-[#3f80b2] sm:hidden">浏览全部工具 →</Link>
      </section>
      <section className="border-y border-slate-100 bg-[#f7fafc]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-ink">按学科找工具</h2>
          <p className="mt-2 text-slate-600">选择一个方向，找到适合现在的练习。</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((item) => <CategoryCard key={item.category} {...item} />)}</div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#dcece2] bg-[#f2faf5] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div><p className="text-sm font-semibold text-leaf">最近更新</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">汉字花园</h2><p className="mt-2 text-slate-600">一年级、二年级、四年级生字学习工具</p></div>
          <a href="https://hanzi.xuebabangbang.cn" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#bcdcc9] bg-white px-4 py-2 text-sm font-semibold text-leaf transition-colors hover:bg-[#e5f4eb] sm:mt-0">去看看 <span aria-hidden="true" className="ml-1">→</span></a>
        </div>
      </section>
    </>
  );
}
