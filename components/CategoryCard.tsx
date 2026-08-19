import Link from "next/link";
import type { ToolCategory } from "../data/tools";

type CategoryCardProps = { category: ToolCategory; title: string; description: string; accent: string };

const backgrounds: Record<ToolCategory, string> = {
  chinese: "bg-[#dff2e6] border-[#b8ddc6] shadow-[0_7px_0_#b8ddc6]",
  math: "bg-[#dceffa] border-[#b9dced] shadow-[0_7px_0_#b9dced]",
  english: "bg-[#fff1b8] border-[#ead477] shadow-[0_7px_0_#ead477]",
  general: "bg-[#eee5fa] border-[#d5c2ec] shadow-[0_7px_0_#d5c2ec]",
};

const icons: Record<ToolCategory, string> = {
  chinese: "字",
  math: "123",
  english: "ABC",
  general: "✦",
};

export function CategoryCard({ category, title, description }: CategoryCardProps) {
  return (
    <Link href={`/tools?category=${category}`} className={`group relative mt-3 rounded-[20px] border-2 p-5 transition duration-200 hover:-translate-y-1 ${backgrounds[category]}`}>
      <div className="absolute -top-3 left-5 flex gap-2.5" aria-hidden="true">
        <span className="h-6 w-6 rounded-full border-2 border-white/70 bg-inherit shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]" />
        <span className="h-6 w-6 rounded-full border-2 border-white/70 bg-inherit shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]" />
      </div>
      <div className="mt-2 flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/70 text-sm font-black text-ink shadow-sm">{icons[category]}</div>
      <h3 className="mt-4 text-lg font-black text-ink">{title}</h3>
      <p className="mt-1.5 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-bold text-[#385767]">查看工具 <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">→</span></span>
    </Link>
  );
}
