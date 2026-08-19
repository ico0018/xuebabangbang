import type { Tool } from "../data/tools";
import { ToolCard } from "./ToolCard";

type ToolGridProps = { tools: Tool[] };

export function ToolGrid({ tools }: ToolGridProps) {
  if (tools.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">没有找到匹配的工具，换个关键词试试吧。</p>;
  }

  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div>;
}
