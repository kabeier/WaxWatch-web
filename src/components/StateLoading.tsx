import { ReactNode, useId } from "react";

type StateLoadingProps = {
  title?: string;
  message?: string;
  detail?: string;
  action?: ReactNode;
};

export function StateLoading({
  title = "Loading",
  message = "Loading…",
  detail,
  action,
}: StateLoadingProps) {
  const titleId = useId();

  return (
    <section role="status" aria-live="polite" aria-busy="true" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}
