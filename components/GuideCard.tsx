import Image from "next/image";
import type { Tool } from "../data/tools";

export function GuideCard({ tool }: { tool: Tool }) {
  return (
    <article className={`guide-card guide-card-${tool.color}`}>
      <div className="guide-card-heading">
        <Image
          className="tool-illustration"
          src={`/illustrations/${tool.illustration}.svg`}
          alt=""
          width={180}
          height={120}
        />
        <h2>{tool.name}</h2>
      </div>
      <ol className="guide-steps">
        {tool.steps.map((step, index) => (
          <li key={step}>
            <span className="step-number" aria-hidden="true">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <div className="guide-actions">
        <a className="primary-button" href={tool.href}>
          {tool.action}
          <span aria-hidden="true">→</span>
        </a>
        {tool.secondaryAction && (
          <a className="secondary-link" href={tool.secondaryAction.href}>
            {tool.secondaryAction.label}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
