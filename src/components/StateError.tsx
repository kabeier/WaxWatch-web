export function StateError({
  message = "Something went wrong.",
  detail,
}: {
  message?: string;
  detail?: string;
}) {
  return (
    <div>
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}
