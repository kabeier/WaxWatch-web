import { ReactNode, useId } from "react";

type BaseStateProps = {
  title?: string;
  message?: string;
  detail?: string;
  action?: ReactNode;
};

type SharedStateProps = BaseStateProps & {
  tone?: "default" | "error";
  role?: "status" | "alert";
  busy?: boolean;
};

type StateRateLimitedProps = BaseStateProps & {
  retryAfterSeconds?: number;
};

function SharedState({
  title,
  message,
  detail,
  action,
  tone = "default",
  role = "status",
  busy = false,
}: SharedStateProps) {
  const titleId = useId();

  return (
    <section
      className={`ww-state ww-state-${tone}`}
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      aria-busy={busy || undefined}
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      {message ? <p>{message}</p> : null}
      {detail ? <p>{detail}</p> : null}
      {action ? <div className="ww-state-action">{action}</div> : null}
    </section>
  );
}

export function StateLoading({
  title = "Loading",
  message = "Loading…",
  detail,
  action,
}: BaseStateProps) {
  return (
    <SharedState
      title={title}
      message={message}
      detail={detail}
      action={action}
      busy
      role="status"
    />
  );
}

export function StateEmpty({
  title = "Nothing to show",
  message = "No data found.",
  detail,
  action,
}: BaseStateProps) {
  return <SharedState title={title} message={message} detail={detail} action={action} />;
}

export function StateError({
  title = "Something went wrong",
  message = "Something went wrong.",
  detail,
  action,
}: BaseStateProps) {
  return (
    <SharedState
      title={title}
      message={message}
      detail={detail}
      action={action}
      role="alert"
      tone="error"
    />
  );
}

export function StateRateLimited({
  title = "Rate limit reached",
  message = "Rate limited. Please retry later.",
  detail,
  action,
  retryAfterSeconds,
}: StateRateLimitedProps) {
  const titleId = useId();

  return (
    <section
      className="ww-state ww-state-error"
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
      <p>
        Retry-After:{" "}
        {typeof retryAfterSeconds === "number" ? `${retryAfterSeconds}s` : "Not provided"}
      </p>
      {action ? <div className="ww-state-action">{action}</div> : null}
    </section>
  );
}
