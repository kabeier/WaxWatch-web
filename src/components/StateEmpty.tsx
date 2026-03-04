import { ReactNode, useId } from "react";

type StateEmptyProps = {
  title?: string;
  message?: string;
  detail?: string;
  action?: ReactNode;
};

export function StateEmpty({
  title = "Nothing to show",
  message = "No data found.",
  detail,
  action,
}: StateEmptyProps) {
  const titleId = useId();

  return (
    <section role="status" aria-live="polite" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}
