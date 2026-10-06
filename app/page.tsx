import { CommunitySection } from "../components/CommunitySection";
import { GuideCard } from "../components/GuideCard";
import { tools } from "../data/tools";

export default function HomePage() {
  return (
    <div className="page-shell home-page">
      <section
        id="tools"
        className="tools-section"
        aria-labelledby="tools-heading"
      >
        <h1 id="tools-heading">今天，想用哪个小工具？</h1>
        <div className="guide-grid">
          {tools.map((tool) => (
            <GuideCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
      <CommunitySection />
    </div>
  );
}
