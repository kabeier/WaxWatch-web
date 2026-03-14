const DEFAULT_READINESS_THRESHOLD_SECONDS = 5;

export function parseReadinessThresholdSeconds(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_READINESS_THRESHOLD_SECONDS;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return DEFAULT_READINESS_THRESHOLD_SECONDS;
  }

  return parsed;
}

export function getReadinessThresholdSeconds(): number {
  return parseReadinessThresholdSeconds(process.env.READY_MIN_UPTIME_SECONDS);
}
