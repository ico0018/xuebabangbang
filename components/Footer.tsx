export function Footer() {
  return (
    <footer className="bg-[#f5f1e8]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pb-10 pt-2 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p><span className="font-black text-black/65">学霸帮帮</span> · 把学习里的小麻烦，做成顺手的小工具。</p>
        <p>© {new Date().getFullYear()} xuebabangbang.cn</p>
      </div>
    </footer>
  );
}
