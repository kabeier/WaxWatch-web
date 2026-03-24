import { useId, type ReactNode } from "react";

type StateTone = "loading" | "empty" | "error" | "rate-limited";

type StateBaseProps = {
  title: string;
  message: string;
  detail?: string;
  action?: ReactNode;
  role: "status" | "alert";
  busy?: boolean;
  retryAfterSeconds?: number;
  showRetryAfter?: boolean;
  tone?: StateTone;
};

const STATE_BADGE_LABEL: Record<StateTone, string> = {
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  "rate-limited": "Rate limited",
};

const STATE_BADGE_TONE: Record<StateTone, "neutral" | "accent" | "warning" | "error"> = {
  loading: "accent",
  empty: "neutral",
  error: "error",
  "rate-limited": "warning",
};

export function StateBase({
  title,
  message,
  detail,
  action,
  role,
  busy,
  retryAfterSeconds,
  showRetryAfter,
  tone = "empty",
}: StateBaseProps) {
  const titleId = useId();
  const descriptionId = useId();
  const helperToneClass = tone === "rate-limited" ? "ww-helper-text--warning" : undefined;

  return (
    <section
      aria-busy={busy}
      aria-atomic="true"
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={`ww-card-base ww-card-base--padding-lg ww-state ww-state--${tone}`}
      role={role}
    >
      <div className="ww-card-base__header ww-state__header">
        <span className={`ww-badge ww-badge--${STATE_BADGE_TONE[tone]}`}>
          {STATE_BADGE_LABEL[tone]}
        </span>
        <h2 className="ww-card-base__title ww-state__title" id={titleId}>
          {title}
        </h2>
      </div>

      <div className="ww-card-base__body ww-state__body">
        <p className="ww-state__message" id={descriptionId}>
          {message}
        </p>
        {detail ? <p className="ww-helper-text ww-state__detail">{detail}</p> : null}
        {showRetryAfter ? (
          <p className={`ww-helper-text ww-state__detail ${helperToneClass ?? ""}`.trim()}>
            Retry-After:{" "}
            {typeof retryAfterSeconds === "number" ? `${retryAfterSeconds}s` : "Not provided"}
          </p>
        ) : null}
      </div>

      {action ? <div className="ww-card-base__footer ww-state__footer">{action}</div> : null}
      {busy ? (
        <div className="ww-state__busy" aria-hidden="true">
          <span className="ww-state__busy-dot" />
          <span className="ww-state__busy-dot" />
          <span className="ww-state__busy-dot" />
        </div>
      ) : null}
    </section>
  );
}
