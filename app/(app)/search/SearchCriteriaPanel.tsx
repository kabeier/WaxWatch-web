"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, CardFooter, TextInput } from "@/components/ui/primitives/base";
import { StateError } from "@/components/ui/primitives/state";

import { useSearchPageState } from "./SearchPageState";

export default function SearchCriteriaPanel() {
  const {
    isBusy,
    keywordsInput,
    pageInput,
    pageSizeInput,
    providersInput,
    queryPayload,
    searchErrors,
    searchMutation,
    searchPageHasError,
    setKeywordsInput,
    setLastSubmittedQuery,
    setPageInput,
    setPageSizeInput,
    setProvidersInput,
  } = useSearchPageState();

  return (
    <>
      {searchErrors.length > 0 ? (
        <div id="search-form-errors">
          <StateError
            message="Please fix search validation issues before submitting."
            detail={searchErrors.join(" ")}
          />
        </div>
      ) : null}

      <form
        className={pageViewStyles.formStack}
        aria-describedby={searchErrors.length > 0 ? "search-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (searchErrors.length > 0) {
            return;
          }

          setLastSubmittedQuery(queryPayload);
          searchMutation.mutate(queryPayload);
        }}
      >
        <label className={pageViewStyles.labelStack} htmlFor="search-keywords">
          <span className={pageViewStyles.labelText}>Keywords (comma-separated)</span>
          <TextInput
            id="search-keywords"
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.currentTarget.value)}
            disabled={isBusy}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="search-providers">
          <span className={pageViewStyles.labelText}>Providers (comma-separated)</span>
          <TextInput
            id="search-providers"
            value={providersInput}
            onChange={(event) => setProvidersInput(event.currentTarget.value)}
            disabled={isBusy}
          />
        </label>
        <div className={pageViewStyles.formGrid}>
          <label className={pageViewStyles.labelStack} htmlFor="search-page">
            <span className={pageViewStyles.labelText}>Page</span>
            <TextInput
              id="search-page"
              type="number"
              min={1}
              value={pageInput}
              onChange={(event) => setPageInput(event.currentTarget.value)}
              disabled={isBusy}
              error={searchPageHasError}
              aria-invalid={searchPageHasError}
              aria-describedby={searchPageHasError ? "search-form-errors" : undefined}
            />
          </label>
          <label className={pageViewStyles.labelStack} htmlFor="search-page-size">
            <span className={pageViewStyles.labelText}>Page size</span>
            <TextInput
              id="search-page-size"
              type="number"
              min={1}
              max={100}
              value={pageSizeInput}
              onChange={(event) => setPageSizeInput(event.currentTarget.value)}
              disabled={isBusy}
              error={searchPageHasError}
              aria-invalid={searchPageHasError}
              aria-describedby={searchPageHasError ? "search-form-errors" : undefined}
            />
          </label>
        </div>
        <CardFooter>
          <Button type="submit" disabled={isBusy || searchErrors.length > 0}>
            {searchMutation.isPending ? "Running search…" : "Run search"}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
