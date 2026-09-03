import { PROJECT_ACTIVITY } from "../lib/mock-copy";

export const ActivityTimeline = () => (
  <ol className="activity-timeline" aria-label="作業タイムライン">
    {PROJECT_ACTIVITY.map((item) => (
      <li key={item.id}>
        <i aria-hidden="true" />
        <div>
          <p>{item.detail}</p>
          <time>{item.time}</time>
        </div>
      </li>
    ))}
  </ol>
);
