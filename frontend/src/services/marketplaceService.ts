import apiClient from "./apiClient";
import type {
  ProducerCreateRequest,
  ProducerResponse,
  ProducerListResponse,
  EnergyListingCreateRequest,
  EnergyListingResponse,
  EnergyListingListResponse,
  BuyEnergyRequest,
  BuyEnergyResponse,
  ProducerStatus,
  EnergySource,
  ListingStatus,
} from "@/types";

/* ── Producers ───────────────────────────────────────── */

export const marketplaceService = {
  async createProducer(payload: ProducerCreateRequest): Promise<ProducerResponse> {
    const { data } = await apiClient.post<ProducerResponse>(
      "/marketplace/producers",
      payload,
    );
    return data;
  },

  async listProducers(params?: {
    status?: ProducerStatus;
    owner_id?: string;
    skip?: number;
    limit?: number;
  }): Promise<ProducerListResponse> {
    const { data } = await apiClient.get<ProducerListResponse>(
      "/marketplace/producers",
      { params },
    );
    return data;
  },

  async getProducer(producerId: string): Promise<ProducerResponse> {
    const { data } = await apiClient.get<ProducerResponse>(
      `/marketplace/producers/${producerId}`,
    );
    return data;
  },

  async verifyProducer(producerId: string): Promise<ProducerResponse> {
    const { data } = await apiClient.patch<ProducerResponse>(
      `/marketplace/producers/${producerId}/verify`,
    );
    return data;
  },

  /* ── Listings ──────────────────────────────────────── */

  async createListing(
    payload: EnergyListingCreateRequest,
  ): Promise<EnergyListingResponse> {
    const { data } = await apiClient.post<EnergyListingResponse>(
      "/marketplace/listings",
      payload,
    );
    return data;
  },

  async listListings(params?: {
    energy_source?: EnergySource;
    status?: ListingStatus;
    skip?: number;
    limit?: number;
  }): Promise<EnergyListingListResponse> {
    const { data } = await apiClient.get<EnergyListingListResponse>(
      "/marketplace/listings",
      { params },
    );
    return data;
  },

  async getListing(listingId: string): Promise<EnergyListingResponse> {
    const { data } = await apiClient.get<EnergyListingResponse>(
      `/marketplace/listings/${listingId}`,
    );
    return data;
  },

  async buyEnergy(payload: BuyEnergyRequest): Promise<BuyEnergyResponse> {
    const { data } = await apiClient.post<BuyEnergyResponse>(
      "/marketplace/buy",
      payload,
    );
    return data;
  },
};
