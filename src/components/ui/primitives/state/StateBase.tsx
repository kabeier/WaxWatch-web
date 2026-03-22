import { useId, type ReactNode } from "react";

import { Badge, HelperText } from "@/components/ui/primitives/base/feedback";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base/surfaces";

type StateTone = "loading" | "empty" | "error" | "rate-limited";

type StateBaseProps = {
  title: string;
  message: string;
  detail?: string;
  action?: ReactNode;
  role: "status" | "alert";
  busy?: boolean;
  retryAfterSeconds?: number;
  showRetryAfter?: boolean;
  tone?: StateTone;
};

const STATE_BADGE_LABEL: Record<StateTone, string> = {
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  "rate-limited": "Rate limited",
};

const STATE_BADGE_TONE: Record<StateTone, "neutral" | "accent" | "warning" | "error"> = {
  loading: "accent",
  empty: "neutral",
  error: "error",
  "rate-limited": "warning",
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
  tone = "empty",
}: StateBaseProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Card
      aria-busy={busy}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={`ww-state ww-state--${tone}`}
      padding="lg"
      role={role}
    >
      <CardHeader className="ww-state__header">
        <Badge tone={STATE_BADGE_TONE[tone]}>{STATE_BADGE_LABEL[tone]}</Badge>
        <CardTitle className="ww-state__title" id={titleId}>
          {title}
        </CardTitle>
      </CardHeader>

      <CardBody className="ww-state__body">
        <p className="ww-state__message" id={descriptionId}>
          {message}
        </p>
        {detail ? <HelperText className="ww-state__detail">{detail}</HelperText> : null}
        {showRetryAfter ? (
          <HelperText
            className="ww-state__detail"
            tone={tone === "rate-limited" ? "warning" : "default"}
          >
            Retry-After:{" "}
            {typeof retryAfterSeconds === "number" ? `${retryAfterSeconds}s` : "Not provided"}
          </HelperText>
        ) : null}
      </CardBody>

      {action ? <CardFooter className="ww-state__footer">{action}</CardFooter> : null}
      {busy ? (
        <div className="ww-state__busy" aria-hidden="true">
          <span className="ww-state__busy-dot" />
          <span className="ww-state__busy-dot" />
          <span className="ww-state__busy-dot" />
        </div>
      ) : null}
    </Card>
  );
}
