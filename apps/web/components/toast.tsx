"use client";

import { useMockApp } from "../lib/mock-store";

export const Toast = () => {
  const { state } = useMockApp();
  if (!state.toast) {
    return null;
  }
  return (
    <div className="toast elev-lg card" role="status">
      <i aria-hidden="true">●</i>
      {state.toast}
    </div>
  );
};
