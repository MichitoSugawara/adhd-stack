const STEPS = ["接続", "アプリを作成", "作業開始"] as const;

export const OnboardingJourney = ({ current }: { current: 1 | 2 | 3 }) => (
  <ol aria-label="はじめるまでのステップ" className="onboarding-journey">
    {STEPS.map((label, index) => {
      const step = index + 1;
      return (
        <li aria-current={step === current ? "step" : undefined} key={label}>
          <span>{String(step).padStart(2, "0")}</span> {label}
        </li>
      );
    })}
  </ol>
);
