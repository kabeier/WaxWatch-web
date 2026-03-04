import { ReactNode, useId } from "react";

type StateBaseProps = {
  title: string;
  message: string;
  detail?: string;
  action?: ReactNode;
  role: "status" | "alert";
  busy?: boolean;
  retryAfterSeconds?: number;
  showRetryAfter?: boolean;
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
}: StateBaseProps) {
  const titleId = useId();

  return (
    <section
      aria-busy={busy}
      aria-labelledby={titleId}
      aria-live={role === "alert" ? "assertive" : "polite"}
      role={role}
    >
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
      {showRetryAfter ? (
        <p>
          Retry-After:{" "}
          {typeof retryAfterSeconds === "number" ? `${retryAfterSeconds}s` : "Not provided"}
        </p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}
