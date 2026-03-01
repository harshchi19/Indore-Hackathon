/* ── Shared enums ─────────────────────────────────────── */

export enum UserRole {
  CONSUMER = "consumer",
  PRODUCER = "producer",
  ADMIN = "admin",
}

export enum EnergySource {
  SOLAR = "solar",
  WIND = "wind",
  HYDRO = "hydro",
  BIOMASS = "biomass",
  GEOTHERMAL = "geothermal",
}

export enum ListingStatus {
  ACTIVE = "active",
  SOLD = "sold",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum ProducerStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  SUSPENDED = "suspended",
}

export enum ContractType {
  SPOT = "spot",
  SCHEDULED = "scheduled",
}

export enum ContractStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SETTLED = "settled",
  DISPUTED = "disputed",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum DisputeStatus {
  OPEN = "open",
  REVIEWING = "reviewing",
  RESOLVED = "resolved",
}

export enum MeterReadingStatus {
  SYNCED = "synced",
  ANOMALY = "anomaly",
}
