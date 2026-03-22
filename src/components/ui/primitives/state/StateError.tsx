import { type ReactNode } from "react";

import { StateBase } from "./StateBase";

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
  return (
    <StateBase
      action={action}
      detail={detail}
      message={message}
      role="alert"
      title={title}
      tone="error"
    />
  );
}
