import { type ReactNode } from "react";

import { StateBase } from "./StateBase";

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
  return (
    <StateBase
      action={action}
      busy
      detail={detail}
      message={message}
      role="status"
      title={title}
      tone="loading"
    />
  );
}
