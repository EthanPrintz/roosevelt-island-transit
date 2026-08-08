# Roosevelt Island Transit Core Architecture (`src/lib/transit/`)

A decoupled, provider-agnostic domain layer for tracking public transit across 6 Roosevelt Island transit channels.

---

## 📁 Directory Layout

```
src/lib/transit/
├── domain/                      # Core Contracts & Types (GTFS-RT / GBFS Aligned)
│   ├── types.ts                 # BaseDeparture, SubwayDeparture, TramDeparture, BikeStation, etc.
│   └── provider.ts              # TransitProvider Interface & Capability Set
├── fixtures/                    # Mock JSON Fixtures for TDD & Offline Testing
│   ├── tram.json, subway.json, redbus.json, q102.json, ferry.json, citibike.json
├── providers/                   # Provider Adapter Implementations
│   ├── MockTramProvider.ts & MockTramProvider.test.ts
│   ├── MockSubwayProvider.ts & MockSubwayProvider.test.ts
│   ├── MockRedBusProvider.ts & MockRedBusProvider.test.ts
│   ├── MockQ102Provider.ts & MockQ102Provider.test.ts
│   ├── MockFerryProvider.ts & MockFerryProvider.test.ts
│   └── MockCitiBikeProvider.ts & MockCitiBikeProvider.test.ts
└── aggregator/                  # Multi-Modal Orchestrator
    ├── TransitAggregator.ts     # Concurrent fetch, Promise.allSettled error boundary, & sorting
    └── TransitAggregator.test.ts# Vitest test suite
```

---

## 🛠️ How to Implement a Live Upstream Provider

To replace a mock provider with a live external API provider (e.g. MTA GTFS-RT feed):

1. Create a new provider file in `src/lib/transit/providers/` (e.g. `MtaGtfsSubwayProvider.ts`).
2. Implement the `TransitProvider` interface:

```typescript
import type { TransitProvider, ProviderCapability } from '../domain/provider';
import type { ProviderResult, SubwayDeparture } from '../domain/types';

export class MtaGtfsSubwayProvider implements TransitProvider {
  readonly mode = 'subway';
  readonly name = 'MTA Realtime GTFS Feed';
  readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

  async getDepartures(): Promise<ProviderResult<SubwayDeparture>> {
    // 1. Fetch GTFS-RT Protobuf payload from MTA endpoint
    // 2. Parse TripUpdates for Roosevelt Island B29 station
    // 3. Map to SubwayDeparture[]
    return {
      data: parsedDepartures,
      fetchedAt: new Date().toISOString(),
      isCached: false,
    };
  }
}
```

3. Add a corresponding Vitest test file `MtaGtfsSubwayProvider.test.ts` with mock HTTP fixtures.
4. Register the new provider instance with `TransitAggregator`:

```typescript
aggregator.registerProvider(new MtaGtfsSubwayProvider());
```

---

## 🔬 Testing Guidelines

All providers must pass clean unit testing:

```bash
bun run test
```
