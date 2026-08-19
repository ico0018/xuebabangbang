import type { Tool } from "../data/tools";

type ToolCardProps = { tool: Tool };

export function ToolCard({ tool }: ToolCardProps) {
  const isOnline = tool.status === "online";

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl" aria-hidden="true">{tool.icon}</span>
        <span className={isOnline ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"}>
          {isOnline ? "已上线" : "即将上线"}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">{tool.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{tool.description}</p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label={`${tool.name} 标签`}>
        {tool.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>)}
      </div>
      <div className="mt-6 pt-1">
        {isOnline && tool.href ? (
          <a href={tool.href} target={tool.external ? "_blank" : undefined} rel={tool.external ? "noopener noreferrer" : undefined} className="inline-flex min-h-11 items-center rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3f80b2]">
            立即使用 <span aria-hidden="true" className="ml-1">→</span>
          </a>
        ) : (
          <button type="button" disabled className="min-h-11 cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">即将上线</button>
        )}
      </div>
    </article>
  );
}
