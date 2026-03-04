import { ReactNode, useId } from "react";

type StateErrorProps = {
  title?: string;
  message?: string;
  detail?: string;
  action?: ReactNode;
};

export function StateError({
  title = "Something went wrong",
  message = "Something went wrong.",
  detail,
  action,
}: StateErrorProps) {
  const titleId = useId();

  return (
    <section role="alert" aria-live="assertive" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}
