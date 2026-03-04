import { ReactNode, useId } from "react";

type StateRateLimitedProps = {
  title?: string;
  message?: string;
  detail?: string;
  action?: ReactNode;
  retryAfterSeconds?: number;
};

export function StateRateLimited({
  title = "Rate limit reached",
  message = "Rate limited. Please retry later.",
  detail,
  action,
  retryAfterSeconds,
}: StateRateLimitedProps) {
  const titleId = useId();

  return (
    <section role="alert" aria-live="assertive" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
      <p>
        Retry-After: {typeof retryAfterSeconds === "number" ? `${retryAfterSeconds}s` : "Not provided"}
      </p>
      {action ? <div>{action}</div> : null}
    </section>
  );
}
