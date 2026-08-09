# Roosevelt Island Public Transit Tracker

A highly modular, multi-pronged public transit tracking web application built on **Bun v1.3**, **SvelteKit 2**, **Svelte 5 Runes**, **Tailwind CSS v4**, **Hugeicons**, and **Biome v2.3**.

## 🚀 Repositories

- **Project Repository**: [EthanPrintz/roosevelt-island-transit](https://github.com/EthanPrintz/roosevelt-island-transit)
- **Base Template**: [EthanPrintz/svelte-base](https://github.com/EthanPrintz/svelte-base)

---

## 🚇 Supported Transit Channels & Live Feeds

1. **MTA Subway (F & M Trains)**: Live GTFS-RT Protobuf feed + static GTFS baseline + **63rd St Service Switch Alerts** + Dynamic Active Horizon Suppression.
2. **NYC Ferry (Astoria Line)**: Live GTFS-RT Protobuf trip updates + GPS vehicle position telemetry (speed in knots, bearing) + static GTFS.
3. **Roosevelt Island Tramway**: Real-time cabin tracking (`North Cabin` vs `South Cabin`), terminal status (`Boarding` vs `In Transit`), and headway timetable engine.
4. **Citi Bike**: GBFS v3.0 real-time dock capacity, classic bike, and e-bike availability meters across Roosevelt Island.
5. **MTA Q102 Bus & RIOC Red Bus**: Local island shuttle stop predictions and Queens route schedules.

---

## 🧩 Architecture & Modular TDD Structure

The transit layer is decoupled from UI rendering via the `TransitProvider` interface contract and managed by `TransitAggregator`:

```
src/lib/transit/
├── domain/                      # Core Contracts & Domain Interfaces
│   ├── types.ts                 # TransitMode, TransitDeparture, BikeStation, TransitAlert
│   └── provider.ts              # TransitProvider Interface Contract
├── fixtures/                    # Mock JSON Fixtures for TDD & Deterministic UI
│   ├── tram.json, subway.json, redbus.json, q102.json, ferry.json, citibike.json
├── providers/                   # Live Hybrid & Mock Providers (Adhering to TransitProvider Contract)
│   ├── LiveSubwayProvider.ts & LiveSubwayProvider.test.ts
│   ├── LiveFerryProvider.ts & LiveFerryProvider.test.ts
│   ├── LiveTramProvider.ts & LiveTramProvider.test.ts
│   ├── LiveCitiBikeProvider.ts & LiveCitiBikeProvider.test.ts
│   ├── MockSubwayProvider.ts, MockFerryProvider.ts, MockTramProvider.ts, etc.
├── utils/                       # Shared Data Pipeline Utilities
│   ├── suppression.ts           # Dynamic Active Horizon Suppression (Ghost schedule pruning)
│   └── suppression.test.ts      # Vitest test suite for ghost schedule suppression
└── aggregator/                  # Aggregator Orchestrator
    ├── TransitAggregator.ts     # Aggregates provider streams with Promise.allSettled error boundaries
    └── TransitAggregator.test.ts# Vitest test suite for aggregator
```

---

## 📜 Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `bun run dev` | Starts Vite development server |
| `test` | `bun run test` | Runs Vitest unit test suite (15 test files, 33 tests) |
| `check` | `bun run check` | Runs Svelte template type checking (`svelte-check`) |
| `lint` | `bun run lint` | Runs Biome linter and static code analysis |
| `format` | `bun run format` | Auto-formats code with Biome |
| `build` | `bun run build` | Builds production client & server bundle |

---

## 🤖 Agentic AI Guidelines

Workspace agentic rules are defined in [`.agents/AGENTS.md`](file://./.agents/AGENTS.md). All AI assistants (Antigravity / Gemini) must maintain strict TDD unit test coverage, interface compliance, and dynamic suppression rules when extending transit providers.
