import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Link href="/" className="brand" aria-label="学霸帮帮首页">
          <svg
            className="brand-mark"
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            aria-hidden="true"
          >
            <rect width="34" height="34" rx="11" fill="currentColor" />
            <path
              d="M17 11c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V10c-3-1-6-1-9 1Zm0 0v13"
              stroke="#fffaf2"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="m25 4 .6 2.4L28 7l-2.4.6L25 10l-.6-2.4L22 7l2.4-.6L25 4Z"
              fill="#fffaf2"
            />
          </svg>
          <span>学霸帮帮</span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <Link href="/#tools">工具</Link>
          <Link href="/about">为什么做</Link>
          <Link href="/#community">进群提建议</Link>
        </nav>
      </div>
    </header>
  );
}
