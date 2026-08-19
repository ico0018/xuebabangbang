import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-white">
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#fff6d8] blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 left-[18%] h-44 w-44 rounded-full bg-[#e5f4eb] blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex rounded-full bg-[#fff6d8] px-3 py-1.5 text-sm font-medium text-[#8a6510]">💡 让学习中的小问题更容易解决</p>
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">学习，其实可以简单一点</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">给孩子和家长准备的实用学习小工具</p>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">语文、数学、英语，一些真正用得上的小工具。</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/tools" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3f80b2]">浏览全部工具 <span aria-hidden="true" className="ml-1">→</span></Link>
            <a href="https://hanzi.xuebabangbang.cn" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">看看汉字花园</a>
          </div>
        </div>
      </div>
    </section>
  );
}
