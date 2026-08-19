import Link from "next/link";

const Block = ({
  className,
  label,
  sublabel,
}: {
  className: string;
  label: string;
  sublabel?: string;
}) => (
  <div className={`relative rounded-[22px] border-2 border-white/70 px-5 py-5 shadow-[0_10px_0_rgba(32,49,59,0.08),0_18px_35px_rgba(32,49,59,0.10)] ${className}`}>
    <div className="absolute -top-3 left-6 flex gap-3" aria-hidden="true">
      <span className="h-6 w-6 rounded-full border-2 border-white/60 bg-inherit shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]" />
      <span className="h-6 w-6 rounded-full border-2 border-white/60 bg-inherit shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)]" />
    </div>
    <div className="text-lg font-black tracking-wide text-[#243943]">{label}</div>
    {sublabel ? <div className="mt-1 text-xs font-medium text-[#52646d]">{sublabel}</div> : null}
  </div>
);

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#eee8dc] bg-[#fffdf7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(32,49,59,0.06)_1px,transparent_0)] bg-[size:24px_24px]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-[16px] border border-[#f2d877] bg-[#fff0a8] px-4 py-2 text-sm font-bold text-[#6f5712] shadow-[0_4px_0_#ead276]">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#ffd84d] text-base" aria-hidden="true">💡</span>
            学习中的小问题，我们一起解决
          </div>
          <h1 className="text-4xl font-black leading-[1.13] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
            学习，其实可以
            <span className="relative ml-2 inline-block">
              简单一点
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#bfe7cf]/75 -z-10" aria-hidden="true" />
            </span>
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-slate-600">给孩子和家长准备的实用学习小工具。</p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">语文、数学、英语，把一个个学习难题拆成小积木，慢慢搭起来。</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/tools" className="inline-flex min-h-12 items-center justify-center rounded-[16px] border border-[#3f80b2] bg-sky px-6 py-3 text-sm font-bold text-white shadow-[0_5px_0_#3f80b2] transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_#3f80b2] active:translate-y-1 active:shadow-none">
              浏览全部工具 <span aria-hidden="true" className="ml-1">→</span>
            </Link>
            <a href="https://hanzi.xuebabangbang.cn" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-[16px] border border-[#b8d9c5] bg-[#e5f4eb] px-6 py-3 text-sm font-bold text-[#347054] shadow-[0_5px_0_#b8d9c5] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
              🌱 看看汉字花园
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden h-[390px] w-full max-w-[500px] lg:block" aria-label="学习积木插图">
          <div className="absolute left-[31%] top-3 w-[44%] rotate-2">
            <Block className="bg-[#fff0a8]" label="英语" sublabel="WORDS · READING" />
          </div>
          <div className="absolute left-[7%] top-[128px] w-[47%] -rotate-3">
            <Block className="bg-[#ccebd7]" label="语文" sublabel="汉字 · 拼音 · 阅读" />
          </div>
          <div className="absolute right-[2%] top-[145px] w-[40%] rotate-3">
            <Block className="bg-[#cfe8f8]" label="数学" sublabel="口算 · 计算 · 练习" />
          </div>
          <a href="https://hanzi.xuebabangbang.cn" target="_blank" rel="noopener noreferrer" className="absolute bottom-7 left-[18%] w-[64%] -rotate-1 transition hover:-translate-y-2">
            <Block className="bg-[#f8d6d6]" label="🌱 汉字花园" sublabel="从一颗汉字种子开始学习" />
          </a>
        </div>
      </div>
    </section>
  );
}
