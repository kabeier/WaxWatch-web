export function StateRateLimited({
  message = "Rate limited. Please retry later.",
  retryAfterSeconds,
}: {
  message?: string;
  retryAfterSeconds?: number;
}) {
  return (
    <div>
      <p>{message}</p>
      <p>
        Retry-After:{" "}
        {typeof retryAfterSeconds === "number" ? `${retryAfterSeconds}s` : "Not provided"}
      </p>
    </div>
  );
}
