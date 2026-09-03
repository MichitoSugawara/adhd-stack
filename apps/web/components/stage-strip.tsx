import { STAGE_STRIP } from "../lib/mock-copy";

interface StageStripProperties {
  current: (typeof STAGE_STRIP)[number];
}

export const StageStrip = ({ current }: StageStripProperties) => (
  <p className="stage-strip" aria-label="デモの段階">
    {STAGE_STRIP.map((stage, index) => (
      <span
        className={stage === current ? "is-current" : undefined}
        key={stage}
      >
        {index > 0 ? <i aria-hidden="true">·</i> : null}
        {stage}
      </span>
    ))}
  </p>
);
