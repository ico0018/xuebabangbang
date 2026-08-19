import Link from "next/link";
import type { ToolCategory } from "../data/tools";

type CategoryCardProps = { category: ToolCategory; title: string; description: string; accent: string };

export function CategoryCard({ category, title, description, accent }: CategoryCardProps) {
  return (
    <Link href={`/tools?category=${category}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className={`mb-4 block h-2 w-10 rounded-full ${accent}`} aria-hidden="true" />
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-sky">查看工具 <span aria-hidden="true">→</span></span>
    </Link>
  );
}
