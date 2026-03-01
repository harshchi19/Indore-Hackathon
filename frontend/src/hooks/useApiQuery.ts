import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

/**
 * Generic wrapper around React Query's useQuery for API calls.
 * Provides consistent caching, refetching, and error handling.
 */
export function useApiQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn,
    staleTime: 30_000,
    retry: 1,
    ...options,
  });
}

/**
 * Generic wrapper around React Query's useMutation for API mutations.
 * Auto-invalidates the given query keys after a successful mutation.
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: string[][],
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (...args) => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        );
      }
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
