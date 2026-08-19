export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-9 text-center sm:px-6 lg:px-8">
        <p className="font-semibold text-ink">💡 学霸帮帮 · xuebabangbang</p>
        <p className="mt-2 text-sm text-slate-500">给孩子和家长的实用学习工具。</p>
        <p className="mt-4 text-xs text-slate-400">© {new Date().getFullYear()} 学霸帮帮</p>
      </div>
    </footer>
  );
}
