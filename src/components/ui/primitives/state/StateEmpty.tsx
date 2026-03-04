import { ReactNode } from "react";

import { StateBase } from "./StateBase";

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
  return (
    <StateBase action={action} detail={detail} message={message} role="status" title={title} />
  );
}
