import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f6f4ee]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-black tracking-[-0.03em] text-[#171717]" aria-label="学霸帮帮首页">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e05f43] text-lg" aria-hidden="true">💡</span>
          <span className="text-lg">学霸帮帮</span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-6 text-sm font-bold text-[#403d38] sm:gap-8">
          <Link href="/tools" className="transition hover:text-[#e05f43]">工具箱</Link>
          <a href="https://hanzi.xuebabangbang.cn" target="_blank" rel="noopener noreferrer" className="hidden transition hover:text-[#e05f43] sm:block">汉字花园 ↗</a>
        </nav>
      </div>
    </header>
  );
}
