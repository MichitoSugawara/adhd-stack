import { MOCK_REPO } from "../lib/mock-copy";
import { SERVICES } from "../lib/services";

const CANVAS_NODES = [
  ...SERVICES.map((service) => ({
    id: service.id,
    label: service.label,
    status: "デモ接続",
  })),
  {
    id: "repo",
    label: MOCK_REPO.name,
    status: MOCK_REPO.fullName,
  },
  {
    id: "env",
    label: "Codex env",
    status: MOCK_REPO.envId,
  },
  {
    id: "pages",
    label: "Pages",
    status: "adhd-app-demo",
  },
  {
    id: "convex-app",
    label: "Convex",
    status: MOCK_REPO.project,
  },
] as const;

export const ServiceCanvas = () => (
  <div className="railway-canvas" aria-label="サービスの関係">
    <svg aria-hidden="true" className="railway-wires" viewBox="0 0 640 280">
      <path d="M120 52 C120 88, 200 88, 200 124" />
      <path d="M280 52 C280 88, 200 88, 200 124" />
      <path d="M440 52 C440 88, 360 88, 360 124" />
      <path d="M520 52 C520 88, 440 88, 440 124" />
      <path d="M200 176 C200 208, 240 208, 240 236" />
      <path d="M360 176 C360 208, 400 208, 400 236" />
    </svg>
    <ul className="railway-nodes">
      {CANVAS_NODES.map((node) => (
        <li className="railway-node" key={node.id}>
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
