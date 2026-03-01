import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplaceService";
import type {
  EnergyListingListResponse,
  EnergyListingResponse,
  EnergyListingCreateRequest,
  BuyEnergyRequest,
  BuyEnergyResponse,
  EnergySource,
  ListingStatus,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const listingKeys = {
  all: ["listings"] as const,
  lists: () => [...listingKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...listingKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...listingKeys.all, "detail", id] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useListings(params?: {
  energy_source?: EnergySource;
  status?: ListingStatus;
  skip?: number;
  limit?: number;
}) {
  return useQuery<EnergyListingListResponse, Error>({
    queryKey: listingKeys.list(params as Record<string, unknown>),
    queryFn: () => marketplaceService.listListings(params),
    staleTime: 30_000,
  });
}

export function useListing(id: string) {
  return useQuery<EnergyListingResponse, Error>({
    queryKey: listingKeys.detail(id),
    queryFn: () => marketplaceService.getListing(id),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation<EnergyListingResponse, Error, EnergyListingCreateRequest>({
    mutationFn: (payload) => marketplaceService.createListing(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useBuyEnergy() {
  const qc = useQueryClient();
  return useMutation<BuyEnergyResponse, Error, BuyEnergyRequest>({
    mutationFn: (payload) => marketplaceService.buyEnergy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
