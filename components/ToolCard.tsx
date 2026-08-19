import type { Tool } from "../data/tools";

type ToolCardProps = { tool: Tool };

const categoryStyle = {
  chinese: "border-[#c3dfcd] shadow-[0_7px_0_#c3dfcd]",
  math: "border-[#c3ddec] shadow-[0_7px_0_#c3ddec]",
  english: "border-[#eadb9c] shadow-[0_7px_0_#eadb9c]",
  general: "border-[#d7c9e8] shadow-[0_7px_0_#d7c9e8]",
};

const iconStyle = {
  chinese: "bg-[#e5f4eb]",
  math: "bg-[#e2f1fa]",
  english: "bg-[#fff4c8]",
  general: "bg-[#f0e9f8]",
};

export function ToolCard({ tool }: ToolCardProps) {
  const isOnline = tool.status === "online";

  return (
    <article className={`group relative mt-3 flex h-full flex-col rounded-[22px] border-2 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_0_rgba(32,49,59,0.10),0_18px_35px_rgba(32,49,59,0.08)] ${categoryStyle[tool.category]}`}>
      <div className="absolute -top-3 left-6 flex gap-3" aria-hidden="true">
        <span className="h-6 w-6 rounded-full border-2 border-white bg-inherit shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]" />
        <span className="h-6 w-6 rounded-full border-2 border-white bg-inherit shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]" />
      </div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <span className={`flex h-14 w-14 items-center justify-center rounded-[17px] text-2xl shadow-sm ${iconStyle[tool.category]}`} aria-hidden="true">{tool.icon}</span>
        <span className={isOnline ? "rotate-2 rounded-[10px] border border-[#b9dfc7] bg-[#e5f4eb] px-2.5 py-1 text-xs font-bold text-emerald-700" : "rotate-2 rounded-[10px] border border-[#eadb9c] bg-[#fff4c8] px-2.5 py-1 text-xs font-bold text-amber-700"}>
          {isOnline ? "已上线" : "即将上线"}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-black tracking-tight text-ink">{tool.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{tool.description}</p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label={`${tool.name} 标签`}>
        {tool.tags.map((tag) => <span key={tag} className="rounded-[9px] bg-[#f4f1e9] px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>)}
      </div>
      <div className="mt-auto pt-6">
        {isOnline && tool.href ? (
          <a href={tool.href} target={tool.external ? "_blank" : undefined} rel={tool.external ? "noopener noreferrer" : undefined} className="inline-flex min-h-11 items-center rounded-[14px] border border-[#3f80b2] bg-sky px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_#3f80b2] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
            立即使用 <span aria-hidden="true" className="ml-1">→</span>
          </a>
        ) : (
          <button type="button" disabled className="min-h-11 cursor-not-allowed rounded-[14px] border border-[#ddd8ce] bg-[#f4f1e9] px-4 py-2 text-sm font-bold text-slate-400">即将上线</button>
        )}
      </div>
    </article>
  );
}
