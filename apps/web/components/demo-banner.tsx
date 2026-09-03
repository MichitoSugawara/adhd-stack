import { DEMO_BADGE, MOCK_LABEL } from "../lib/mock-copy";

export const DemoBanner = () => (
  <p className="demo-banner" role="status">
    <span className="mock-badge">{DEMO_BADGE}</span>
    <span>{MOCK_LABEL}。実サービスにはつながっていません。</span>
  </p>
);
