import Link from "next/link";

const navigation = [
  { href: "/", label: "首页" },
  { href: "/tools", label: "工具箱" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink" aria-label="学霸帮帮首页">
          <span aria-hidden="true" className="text-xl">💡</span>
          <span>学霸帮帮</span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-1 text-sm font-medium text-slate-600 sm:gap-2">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
