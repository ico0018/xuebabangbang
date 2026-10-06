import type { Tool } from "../data/tools";

type ToolCardProps = { tool: Tool };

const categoryStyle = {
  chinese: "bg-[#eee5d6]",
  math: "bg-[#e7e0c8]",
  english: "bg-[#e6e2cf]",
  general: "bg-[#dce7eb]",
};

export function ToolCard({ tool }: ToolCardProps) {
  const isOnline = tool.status === "online";

  return (
    <article className={`group flex h-full flex-col rounded-[26px] border border-black/10 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(35,31,24,0.08)] ${categoryStyle[tool.category]}`}>
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-white/55 font-serif text-xl font-black text-black/70" aria-hidden="true">
          {tool.icon}
        </span>
        <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-bold text-black/45">
          {isOnline ? "可以直接用" : "还在做"}
        </span>
      </div>

      <p className="mt-8 text-xs font-black tracking-[0.14em] text-black/40">{tool.categoryLabel}</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#1d1d1b]">{tool.name}</h2>
      <p className="mt-3 min-h-14 text-sm leading-6 text-black/60">{tool.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {tool.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-black/10 bg-white/35 px-2.5 py-1 text-xs font-semibold text-black/45">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-7">
        {isOnline && tool.href ? (
          <a
            href={tool.href}
            target={tool.external ? "_blank" : undefined}
            rel={tool.external ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 border-b-2 border-black/35 pb-1 text-sm font-black text-black/75 transition group-hover:gap-3 group-hover:border-black"
          >
            打开使用 <span aria-hidden="true">→</span>
          </a>
        ) : (
          <span className="text-sm font-bold text-black/35">做好了再放出来</span>
        )}
      </div>
    </article>
  );
}
