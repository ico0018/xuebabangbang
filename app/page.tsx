import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-[#f6f4ee]">
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <p className="mb-5 text-sm font-bold tracking-[0.18em] text-[#e05f43]">XUEBA BANGBANG · 学习工具实验室</p>
            <h1 className="max-w-4xl text-[48px] font-black leading-[1.02] tracking-[-0.055em] text-[#171717] sm:text-6xl lg:text-[82px]">
              今天哪儿
              <br />
              <span className="text-[#e05f43]">不会？</span>
            </h1>
          </div>
          <div className="max-w-lg pb-2 lg:pb-3">
            <p className="text-xl font-semibold leading-8 text-[#272727] sm:text-2xl sm:leading-9">不想背生字，口算总出错，单词怎么都记不住？</p>
            <p className="mt-4 text-base leading-7 text-[#68645e]">别急着多做十页题。这里有一些小工具，试着换个办法解决。</p>
            <Link href="/tools" className="mt-7 inline-flex items-center border-b-2 border-[#171717] pb-1 text-base font-bold text-[#171717] transition hover:border-[#e05f43] hover:text-[#e05f43]">看看有什么能帮我 →</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="grid auto-rows-[190px] gap-3 md:grid-cols-2 lg:grid-cols-4">
          <a href="https://hanzi.xuebabangbang.cn" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-[28px] bg-[#b9d8b4] p-7 transition duration-300 hover:-translate-y-1 lg:col-span-2 lg:row-span-2 lg:p-10">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-5">
                <span className="text-5xl sm:text-6xl" aria-hidden="true">🌱</span>
                <span className="rounded-full border border-black/15 px-3 py-1 text-xs font-bold text-black/60">已经可以玩</span>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-black/55">汉字花园</p>
                <h2 className="max-w-md text-3xl font-black leading-tight tracking-[-0.035em] text-[#172118] sm:text-4xl">生字，不一定要<br />抄二十遍。</h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-black/60">挑一本课本，看看今天能种下几个汉字。</p>
                <span className="mt-5 inline-block font-bold text-[#172118] transition group-hover:translate-x-1">去种汉字 →</span>
              </div>
            </div>
          </a>

          <div className="relative overflow-hidden rounded-[28px] bg-[#f2c84b] p-7 lg:col-span-2">
            <div className="flex h-full items-start justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-black/50">口算挑战 · 制作中</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#221e12]">给你 60 秒。<br />你能做对几道？</h2>
              </div>
              <span className="text-5xl" aria-hidden="true">🔢</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] bg-[#b8d7eb] p-7 lg:row-span-2">
            <div className="flex h-full flex-col justify-between">
              <span className="text-5xl" aria-hidden="true">🔤</span>
              <div>
                <p className="text-sm font-bold text-black/50">单词实验室 · 制作中</p>
                <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em] text-[#17212a]">sandwich？<br />女巫怎么跑到沙滩上了。</h2>
                <p className="mt-3 text-sm leading-6 text-black/55">用一些奇奇怪怪的方法，把单词记住。</p>
              </div>
            </div>
          </div>

          <Link href="/tools" className="group rounded-[28px] bg-[#e9c8d3] p-7 transition duration-300 hover:-translate-y-1 lg:row-span-2">
            <div className="flex h-full flex-col justify-between">
              <span className="text-5xl" aria-hidden="true">🧰</span>
              <div>
                <p className="text-sm font-bold text-black/50">工具箱</p>
                <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-[#271a1f]">还有什么<br />好东西？</h2>
                <p className="mt-3 text-sm leading-6 text-black/55">新的小工具会慢慢放进来。</p>
                <span className="mt-5 inline-block font-bold transition group-hover:translate-x-1">全部看看 →</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#171717] text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:flex lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-white/45">学霸帮帮</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">学习卡住了，<br />不一定是你不会。<br /><span className="text-[#f2c84b]">也许只是方法不对。</span></h2>
          </div>
          <Link href="/tools" className="mt-10 inline-flex text-lg font-bold text-white lg:mt-0">去工具箱逛逛 →</Link>
        </div>
      </section>
    </main>
  );
}
