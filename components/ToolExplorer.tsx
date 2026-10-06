"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { tools, type ToolCategory } from "../data/tools";
import { ToolGrid } from "./ToolGrid";

const categories: { id: "all" | ToolCategory; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "chinese", label: "语文" },
  { id: "general", label: "学习管理" },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="工具分类">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={
                category === item.id
                  ? "min-h-10 rounded-full bg-[#1d1d1b] px-4 text-sm font-bold text-[#f8f2e8]"
                  : "min-h-10 rounded-full border border-black/15 bg-transparent px-4 text-sm font-bold text-black/50 transition hover:border-black/35 hover:text-black"
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:max-w-xs">
          <label htmlFor="tool-search" className="sr-only">搜索工具</label>
          <input
            id="tool-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜一下……"
            className="w-full rounded-2xl border border-black/15 bg-white/45 px-4 py-3 text-sm text-[#1d1d1b] outline-none placeholder:text-black/30 focus:border-[#b84d36] focus:ring-4 focus:ring-[#b84d36]/10"
          />
        </div>
      </div>

      <div className="mt-8">
        <ToolGrid tools={matchingTools} />
      </div>
    </div>
  );
}
