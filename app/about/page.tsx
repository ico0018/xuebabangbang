import type { Metadata } from "next";
import Link from "next/link";
import { CommunitySection } from "../../components/CommunitySection";

export const metadata: Metadata = {
  title: "为什么做学霸帮帮",
  description: "把陪孩子学习时遇到的具体问题，做成简单的小工具。",
};

export default function AboutPage() {
  return (
    <div className="page-shell about-page">
      <article className="about-article">
        <h1>为什么做学霸帮帮</h1>
        <div className="about-body">
          <p>
            陪孩子学习时，总会遇到一些重复的小麻烦：古诗会背却写不全，生字练过又忘，作业需要一遍遍提醒。
          </p>
          <p>
            我想把这些具体的问题，做成简单的小工具。孩子能自己多完成一步，家长就能少提醒一次。
          </p>
          <p>
            学霸帮帮会从这些日常需要出发，慢慢完善。你遇到了什么麻烦，想要什么工具，也欢迎进群告诉我。
          </p>
        </div>
      </article>
      <CommunitySection />
      <Link className="back-link" href="/#tools">
        <span aria-hidden="true">←</span>返回工具
      </Link>
    </div>
  );
}
