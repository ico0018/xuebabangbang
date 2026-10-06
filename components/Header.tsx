import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f1e8]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="学霸帮帮首页">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#b84d36] text-sm font-black text-[#fff9ef]" aria-hidden="true">帮</span>
          <span className="text-[17px] font-black tracking-[-0.03em] text-[#1d1d1b]">学霸帮帮</span>
        </Link>

        <nav aria-label="主导航" className="flex items-center gap-5 text-sm font-bold text-black/60 sm:gap-7">
          <Link href="/#tools" className="transition hover:text-black">三个工具</Link>
          <Link href="/#about" className="hidden transition hover:text-black sm:block">为什么做</Link>
          <Link href="/tools" className="rounded-full border border-black/10 px-3.5 py-2 text-[#1d1d1b] transition hover:border-black/40">工具箱</Link>
        </nav>
      </div>
    </header>
  );
}
