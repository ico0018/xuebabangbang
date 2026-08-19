"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { tools, type ToolCategory } from "../data/tools";
import { ToolGrid } from "./ToolGrid";

const categories: { id: "all" | ToolCategory; label: string }[] = [
  { id: "all", label: "全部" }, { id: "chinese", label: "语文" }, { id: "math", label: "数学" }, { id: "english", label: "英语" }, { id: "general", label: "通用" },
];

function isCategory(value: string | null): value is ToolCategory {
  return value === "chinese" || value === "math" || value === "english" || value === "general";
}

function categoryFromSearchParam(value: string | null): "all" | ToolCategory {
  return isCategory(value) ? value : "all";
}

export function ToolExplorer() {
  const searchParams = useSearchParams();
  const initialCategory = categoryFromSearchParam(searchParams.get("category"));
  const [category, setCategory] = useState<"all" | ToolCategory>(initialCategory);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setCategory(categoryFromSearchParam(searchParams.get("category")));
  }, [searchParams]);

  const matchingTools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === "all" || tool.category === category;
      const searchableText = [tool.name, tool.description, tool.categoryLabel, ...tool.tags].join(" ").toLocaleLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, query]);

  return (
    <div>
      <label htmlFor="tool-search" className="sr-only">搜索工具</label>
      <input id="tool-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具……" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink outline-none placeholder:text-slate-400 focus:border-sky focus:ring-4 focus:ring-sky/15" />
      <div className="mt-5 flex flex-wrap gap-2" aria-label="工具分类">
        {categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={category === item.id ? "min-h-10 rounded-full bg-sky px-4 text-sm font-semibold text-white" : "min-h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:border-sky hover:text-sky"}>{item.label}</button>)}
      </div>
      <div className="mt-8"><ToolGrid tools={matchingTools} /></div>
    </div>
  );
}
