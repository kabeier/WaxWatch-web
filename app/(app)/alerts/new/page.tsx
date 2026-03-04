"use client";

import { useMemo, useState } from "react";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useCreateWatchRuleMutation, useMeQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function NewAlertPage() {
  const meQuery = useMeQuery();
  const createWatchRuleMutation = useCreateWatchRuleMutation();

  const [name, setName] = useState("My new alert");
  const [keywordsInput, setKeywordsInput] = useState("vinyl");
  const [pollIntervalInput, setPollIntervalInput] = useState("300");
  const [isActive, setIsActive] = useState(true);

  const pollInterval = Number(pollIntervalInput);
  const validationMessage = useMemo(() => {
    if (name.trim().length < 1 || name.trim().length > 120) {
      return "Name must be between 1 and 120 characters.";
    }
    if (
      keywordsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean).length === 0
    ) {
      return "Enter at least one keyword.";
    }
    if (!Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400) {
      return "Poll interval must be an integer between 30 and 86400 seconds.";
    }

    return null;
  }, [keywordsInput, name, pollInterval]);

  const isPending = createWatchRuleMutation.isPending;

  return (
    <section>
      <h1>Create Alert</h1>
      <p>Create a new alert rule from saved search criteria.</p>

      {meQuery.isLoading ? <StateLoading message="Loading alert preset data…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          title="Alert setup is temporarily rate-limited"
          message="We cannot load setup data right now."
          detail="Wait for cooldown, then retry fetching alert setup data."
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
          action={
            <button type="button" onClick={() => meQuery.refetch()}>
              Retry setup load
            </button>
          }
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          title="Alert setup failed to load"
          message="Could not load alert setup data."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => meQuery.refetch()}>
              Retry setup load
            </button>
          }
        />
      ) : null}
      {meQuery.data && (!meQuery.data.integrations || meQuery.data.integrations.length === 0) ? (
        <StateEmpty
          title="No provider integrations"
          message="Connect a provider before creating alerts from search criteria."
        />
      ) : null}

      {validationMessage ? (
        <StateError message="Validation error" detail={validationMessage} />
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (validationMessage || isPending) {
            return;
          }

          createWatchRuleMutation.mutate({
            name: name.trim(),
            query: {
              keywords: keywordsInput
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            },
            poll_interval_seconds: pollInterval,
            is_active: isActive,
          });
        }}
      >
        <label>
          Alert name
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={isPending}
          />
        </label>
        <label>
          Keywords (comma-separated)
          <input
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.currentTarget.value)}
            disabled={isPending}
          />
        </label>
        <label>
          Poll interval (seconds)
          <input
            type="number"
            min={30}
            max={86400}
            value={pollIntervalInput}
            onChange={(event) => setPollIntervalInput(event.currentTarget.value)}
            disabled={isPending}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.currentTarget.checked)}
            disabled={isPending}
          />
          Active immediately
        </label>
        <button type="submit" disabled={Boolean(validationMessage) || isPending}>
          {isPending ? "Saving new alert…" : "Save new alert"}
        </button>
      </form>

      {createWatchRuleMutation.data ? <p>Alert created successfully and ready to run.</p> : null}
      {createWatchRuleMutation.isPending ? <StateLoading message="Saving new alert…" /> : null}
      {createWatchRuleMutation.isError && isRateLimitedError(createWatchRuleMutation.error) ? (
        <StateRateLimited
          title="New alert creation is rate-limited"
          message="Too many create-alert requests were sent."
          detail="Wait for cooldown, then retry creating this alert."
          retryAfterSeconds={getRetryAfterSeconds(createWatchRuleMutation.error)}
          action={
            <button
              type="button"
              disabled={Boolean(validationMessage) || isPending}
              onClick={() => {
                if (validationMessage || isPending) {
                  return;
                }
                createWatchRuleMutation.mutate({
                  name: name.trim(),
                  query: {
                    keywords: keywordsInput
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  },
                  poll_interval_seconds: pollInterval,
                  is_active: isActive,
                });
              }}
            >
              Retry create alert
            </button>
          }
        />
      ) : null}
      {createWatchRuleMutation.isError && !isRateLimitedError(createWatchRuleMutation.error) ? (
        <StateError
          title="Creating alert failed"
          message="Could not save new alert."
          detail={getErrorMessage(createWatchRuleMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={Boolean(validationMessage) || isPending}
              onClick={() => {
                if (validationMessage || isPending) {
                  return;
                }
                createWatchRuleMutation.mutate({
                  name: name.trim(),
                  query: {
                    keywords: keywordsInput
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  },
                  poll_interval_seconds: pollInterval,
                  is_active: isActive,
                });
              }}
            >
              Retry create alert
            </button>
          }
        />
      ) : null}
    </section>
  );
}
