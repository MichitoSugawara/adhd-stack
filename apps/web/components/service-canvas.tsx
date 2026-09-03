import { MOCK_REPO } from "../lib/mock-copy";
import { SERVICES } from "../lib/services";

const TOP_NODES = SERVICES.map((service) => ({
  id: service.id,
  label: service.label,
  status: "デモ接続",
}));

const BOTTOM_NODES = [
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

const NodeList = ({
  nodes,
}: {
  nodes: readonly { id: string; label: string; status: string }[];
}) => (
  <ul className="railway-nodes">
    {nodes.map((node) => (
      <li className="railway-node" key={node.id}>
        <strong>{node.label}</strong>
        <span>
          <i aria-hidden="true" />
          {node.status}
        </span>
      </li>
    ))}
  </ul>
);

export const ServiceCanvas = () => (
  <div className="railway-canvas" aria-label="サービスの関係">
    <svg
      aria-hidden="true"
      className="railway-wires"
      preserveAspectRatio="none"
      viewBox="0 0 800 120"
    >
      <path d="M100 8 C100 48, 100 48, 100 112" />
      <path d="M300 8 C300 48, 300 48, 300 112" />
      <path d="M500 8 C500 48, 500 48, 500 112" />
      <path d="M700 8 C700 48, 700 48, 700 112" />
      <path d="M100 60 C220 60, 280 60, 300 112" />
      <path d="M500 60 C380 60, 320 60, 300 112" />
    </svg>
    <NodeList nodes={TOP_NODES} />
    <NodeList nodes={BOTTOM_NODES} />
  </div>
);
