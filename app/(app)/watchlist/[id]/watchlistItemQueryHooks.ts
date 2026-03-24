import {
  useDeleteWatchReleaseMutation as useDeleteWatchReleaseMutationBase,
  useUpdateWatchReleaseMutation as useUpdateWatchReleaseMutationBase,
  useWatchReleaseDetailQuery as useWatchReleaseDetailQueryBase,
} from "@/lib/query/hooks";

export function useWatchReleaseDetailQuery(id: string) {
  return useWatchReleaseDetailQueryBase(id);
}

export function useUpdateWatchReleaseMutation(id: string) {
  return useUpdateWatchReleaseMutationBase(id);
}

export function useDeleteWatchReleaseMutation(id: string) {
  return useDeleteWatchReleaseMutationBase(id);
}
