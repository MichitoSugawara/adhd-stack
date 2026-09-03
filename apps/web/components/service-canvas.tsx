import { MOCK_REPO } from "../lib/mock-copy";
import { SERVICES } from "../lib/services";

const CANVAS_NODES = [
  ...SERVICES.map((service) => ({
    id: service.id,
    label: service.label,
    status: "デモ接続",
    tone: "ok" as const,
  })),
  {
    id: "repo",
    label: MOCK_REPO.fullName,
    status: "モック repo",
    tone: "ok" as const,
  },
  {
    id: "env",
    label: "Codex env",
    status: MOCK_REPO.envId,
    tone: "ok" as const,
  },
  {
    id: "pages",
    label: "Pages",
    status: MOCK_REPO.pagesUrl,
    tone: "ok" as const,
  },
  {
    id: "convex-app",
    label: "Convex",
    status: MOCK_REPO.project,
    tone: "ok" as const,
  },
] as const;

export const ServiceCanvas = () => (
  <div className="service-canvas" aria-label="サービスの関係">
    <svg aria-hidden="true" className="canvas-wires" viewBox="0 0 320 220">
      <path d="M80 36 C80 58, 80 58, 80 78" />
      <path d="M240 36 C240 58, 240 58, 240 78" />
      <path d="M80 36 C160 36, 160 36, 240 36" />
      <path d="M80 114 C160 114, 160 114, 240 114" />
      <path d="M80 114 C80 136, 80 136, 80 156" />
      <path d="M240 114 C240 136, 240 136, 240 156" />
    </svg>
    <ul className="canvas-nodes">
      {CANVAS_NODES.map((node) => (
        <li className={`canvas-node canvas-node--${node.tone}`} key={node.id}>
          <strong>{node.label}</strong>
          <span>
            <i aria-hidden="true" />
            {node.status}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
