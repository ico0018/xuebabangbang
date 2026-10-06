import { tools } from "../data/tools";

function toolHref(id: string) {
  return tools.find((tool) => tool.id === id)?.href ?? "/tools";
}

const featured = [
  {
    id: "guwen-park",
    kicker: "古诗 · 古文",
    name: "古文乐园",
    title: "会背了，\n还要写得出来。",
    description: "从逐句读，到选字排序，再到全文默写。不是多背几遍，而是把真正卡住的地方找出来。",
    note: "逐句读 · 选字排序 · 全文默写",
    action: "去古文乐园",
    className: "bg-[#dce5d2]",
    ink: "text-[#26321f]",
    preview: (
      <div className="rounded-[22px] border border-black/10 bg-[#f7f3e8] p-5 shadow-[0_10px_25px_rgba(39,49,31,0.08)] sm:p-6">
        <p className="text-xs font-bold tracking-[0.18em] text-black/40">今天读一句</p>
        <p className="mt-4 font-serif text-[22px] leading-9 text-[#2c2a24] sm:text-2xl">小荷才露尖尖角</p>
        <p className="font-serif text-[22px] leading-9 text-[#2c2a24] sm:text-2xl">早有蜻蜓立上头</p>
        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-black/50">
          <span className="rounded-full border border-black/10 px-2.5 py-1">读懂</span>
          <span>→</span>
          <span className="rounded-full border border-black/10 px-2.5 py-1">练一练</span>
          <span>→</span>
          <span className="rounded-full border border-black/10 px-2.5 py-1">自己写</span>
        </div>
      </div>
    ),
  },
  {
    id: "hanzi-garden",
    kicker: "小学语文",
    name: "汉字花园",
    title: "总有几个字，\n第二天又忘了。",
    description: "按课本学，把不会的字留下来慢慢练。少一点机械抄写，多一点真正记住。",
    note: "按课本 · 笔顺 · 生字复习",
    action: "去汉字花园",
    className: "bg-[#f2d8a9]",
    ink: "text-[#352716]",
    preview: (
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <div className="relative grid h-28 w-28 place-items-center border-2 border-[#b84d36]/30 bg-[#fffaf0] sm:h-32 sm:w-32">
          <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#b84d36]/20" />
          <span className="absolute inset-y-0 left-1/2 border-l border-dashed border-[#b84d36]/20" />
          <span className="font-serif text-6xl text-[#9f3f2e] sm:text-7xl">旅</span>
        </div>
        <div className="space-y-2 text-sm font-semibold text-black/50">
          <p>不是：再写 20 遍</p>
          <p className="text-lg text-[#9f3f2e]">是：看清哪里错了</p>
        </div>
      </div>
    ),
  },
  {
    id: "study-planner",
    kicker: "学习计划",
    name: "学习计划器",
    title: "别催下一项。\n让孩子自己看见。",
    description: "今天先做什么、估计多久、什么时候检查。把家长反复提醒的那部分，先交给一个清楚的流程。",
    note: "预测 · 计时 · 检查 · 复盘",
    action: "打开计划器",
    className: "bg-[#cfe0e7]",
    ink: "text-[#1f3038]",
    preview: (
      <div className="rounded-[22px] border border-black/10 bg-[#f8fbfc] p-5 shadow-[0_10px_25px_rgba(31,48,56,0.08)]">
        <p className="text-xs font-bold tracking-[0.18em] text-black/40">今天</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#24343b]"><span className="grid h-6 w-6 place-items-center rounded-full border border-black/10 text-xs">1</span>语文默写 <span className="ml-auto text-xs font-medium text-black/40">15 min</span></div>
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#24343b]"><span className="grid h-6 w-6 place-items-center rounded-full border border-black/10 text-xs">2</span>数学订正 <span className="ml-auto text-xs font-medium text-black/40">20 min</span></div>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/10 px-4 py-3 text-sm font-semibold text-black/40"><span className="grid h-6 w-6 place-items-center rounded-full border border-black/10 text-xs">3</span>做完，自己检查</div>
        </div>
      </div>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#f5f1e8] text-[#1d1d1b]">
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24 lg:px-10 lg:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.18fr_.82fr] lg:items-end">
          <div>
            <p className="mb-5 text-xs font-black tracking-[0.2em] text-[#b84d36] sm:text-sm">学霸帮帮 · XUEBA BANGBANG</p>
            <h1 className="max-w-4xl text-[46px] font-black leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-[78px]">
              有些学习问题，
              <br />
              真的不用再
              <span className="relative ml-2 inline-block">
                抄十遍。
                <span className="absolute -bottom-1 left-0 h-[10px] w-full bg-[#f0b95a]/60" aria-hidden="true" />
              </span>
            </h1>
          </div>

          <div className="max-w-xl lg:pb-2">
            <p className="text-lg font-semibold leading-8 text-[#393833] sm:text-xl">
              一首诗背得滚瓜烂熟，一到默写少两个字；生字昨天会了，今天又忘；计划写了一页，坐下却不知道先做什么。
            </p>
            <p className="mt-4 text-base leading-7 text-[#777166]">我们就从这些小地方开始。做三个打开就能用的小工具。</p>
            <a href="#tools" className="mt-7 inline-flex items-center gap-2 border-b-2 border-[#1d1d1b] pb-1 text-sm font-black transition hover:border-[#b84d36] hover:text-[#b84d36]">
              今天先解决一个 <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-20 pt-8 sm:px-8 sm:pb-28 lg:px-10">
        <div className="mb-7 flex items-end justify-between gap-6 border-b border-black/10 pb-4">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-black/40">现在能用的</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">今天，先卡在哪儿？</h2>
          </div>
          <a href="/tools" className="hidden text-sm font-bold text-black/60 transition hover:text-black sm:block">全部工具 →</a>
        </div>

        <div className="space-y-4">
          {featured.map((item, index) => (
            <a
              key={item.id}
              href={toolHref(item.id)}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block overflow-hidden rounded-[30px] border border-black/10 ${item.className} transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(35,31,24,0.10)]`}
            >
              <div className={`grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-10 ${index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black tracking-[0.16em] text-black/50">{item.kicker}</span>
                    <span className="h-px w-10 bg-black/10" aria-hidden="true" />
                    <span className="text-xs font-bold text-black/40">{item.name}</span>
                  </div>
                  <h3 className={`mt-5 whitespace-pre-line text-[34px] font-black leading-[1.08] tracking-[-0.045em] sm:text-[42px] ${item.ink}`}>{item.title}</h3>
                  <p className="mt-5 max-w-xl text-[15px] font-medium leading-7 text-black/60 sm:text-base">{item.description}</p>
                  <p className="mt-5 text-xs font-bold tracking-wide text-black/40">{item.note}</p>
                  <span className="mt-7 inline-flex items-center gap-2 border-b border-black/40 pb-1 text-sm font-black text-black/75 transition group-hover:gap-3 group-hover:border-black">
                    {item.action} <span aria-hidden="true">→</span>
                  </span>
                </div>
                <div>{item.preview}</div>
              </div>
            </a>
          ))}
        </div>

        <a href="/tools" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl border border-black/10 bg-[#ece7dc] text-sm font-black text-black/60 sm:hidden">
          看全部工具
        </a>
      </section>

      <section id="about" className="border-y border-black/10 bg-[#1f201d] text-[#f7f2e7]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-white/40">为什么做这个站</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">是在陪孩子写作业的时候，慢慢长出来的。</h2>
          </div>
          <div className="max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
            <p>一个字写错了二十遍，第二天还是错。一句古诗会背，落到纸上却空了一格。每天提醒“快点、下一项”，大人和孩子都累。</p>
            <p className="mt-5">于是就把这些重复的小麻烦，一个个做成小工具。能让孩子自己多看懂一步，让家长少喊一句，就算有用。</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-black text-[#f0c66e]">
              <span>不用先学怎么用</span>
              <span>·</span>
              <span>打开就开始</span>
              <span>·</span>
              <span>做完就关</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#b84d36]">学霸帮帮</p>
            <p className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">这个站还会慢慢长大。</p>
          </div>
          <p className="max-w-md text-sm leading-6 text-black/50">但不着急塞满功能。先把真正会用到的东西，一件一件做好。</p>
        </div>
      </section>
    </div>
  );
}
