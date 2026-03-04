import { ReactNode } from "react";

import { StateBase } from "./StateBase";

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
  return (
    <StateBase
      action={action}
      detail={detail}
      message={message}
      retryAfterSeconds={retryAfterSeconds}
      role="alert"
      showRetryAfter
      title={title}
    />
  );
}
