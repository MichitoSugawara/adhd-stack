import type { CSSProperties } from "react";

const paths = {
  apps: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  chevron: "m9 5 7 7-7 7",
  close: "m6 6 12 12M6 18 18 6",
  command:
    "M9 9V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V9Z",
  connect:
    "M8 9H6a4 4 0 0 0 0 8h4a4 4 0 0 0 4-4M16 15h2a4 4 0 0 0 0-8h-4a4 4 0 0 0-4 4M8 13l8-2",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z",
  help: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2M12 16h.01",
  logout: "M9 4H4v16h5m5-13 5 5-5 5M9 12h10",
  menu: "M4 6h16M4 12h16M4 18h16",
  message:
    "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5ZM7 9h10M7 13h7",
  panel: "M3 4h18v16H3zM9 4v16",
  plus: "M12 5v14M5 12h14",
  search: "M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0ZM16 16l5 5",
  spark: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z",
} as const;

export type WorkspaceIconName = keyof typeof paths;

export const WorkspaceIcon = ({
  name,
  size = 18,
  style,
}: {
  name: WorkspaceIconName;
  size?: number;
  style?: CSSProperties;
}) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.65"
    style={style}
    viewBox="0 0 24 24"
    width={size}
  >
    <path d={paths[name]} />
  </svg>
);

export const StackLogo = () => (
  <span className="stack-logo" aria-hidden="true">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" fill="currentColor" />
      <path
        d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);
