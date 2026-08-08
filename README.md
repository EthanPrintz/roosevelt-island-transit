# Roosevelt Island Public Transit Tracker

A highly modular, multi-pronged public transit tracking web application built on **Bun v1.3**, **SvelteKit 2**, **Svelte 5 Runes**, **Tailwind CSS v4**, **Hugeicons**, and **Biome v2.3**.

## 🚀 Repositories

- **Project Repository**: [EthanPrintz/roosevelt-island-transit](https://github.com/EthanPrintz/roosevelt-island-transit)
- **Base Template**: [EthanPrintz/svelte-base](https://github.com/EthanPrintz/svelte-base)

---

## 🚇 Supported Transit Channels

1. **Roosevelt Island Tramway**: Cabin departure countdowns & line service status.
2. **MTA Subway (F & M Trains)**: Roosevelt Island Station departures + **63rd St Service Switch Alerts**.
3. **RIOC Red Bus**: Local island shuttle stop predictions (Motorgate, Octagon, Subway/Tram, Southtown).
4. **MTA Q102 Bus**: Astoria / Queens bridge connection.
5. **NYC Ferry (Astoria Line)**: Roosevelt Island Landing departures to Wall St / Pier 11 & E 90th St.
6. **Citi Bike**: Dock capacity, classic bike, and e-bike availability meters across Roosevelt Island stations.

---

## 🧩 Architecture & Modular TDD Structure

The transit layer is decoupled from UI rendering via the `TransitProvider` interface contract and managed by `TransitAggregator`:

```
src/lib/transit/
├── domain/                      # Core Contracts & Domain Interfaces
│   ├── types.ts                 # TransitMode, TransitDeparture, TransitStation, TransitAlert
│   └── provider.ts              # TransitProvider Interface Contract
├── fixtures/                    # Mock JSON Fixtures for TDD & Deterministic UI
│   ├── tram.json, subway.json, redbus.json, q102.json, ferry.json, citibike.json
├── providers/                   # Mock Provider Stubs (Adhering to TransitProvider Contract)
│   ├── MockTramProvider.ts & MockTramProvider.test.ts
│   ├── MockSubwayProvider.ts & MockSubwayProvider.test.ts
│   ├── MockRedBusProvider.ts & MockRedBusProvider.test.ts
│   ├── MockQ102Provider.ts & MockQ102Provider.test.ts
│   ├── MockFerryProvider.ts & MockFerryProvider.test.ts
│   └── MockCitiBikeProvider.ts & MockCitiBikeProvider.test.ts
└── aggregator/                  # Aggregator Orchestrator
    ├── TransitAggregator.ts     # Aggregates provider streams with Promise.allSettled error boundaries
    └── TransitAggregator.test.ts# Vitest test suite for aggregator
```

---

## 📜 Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `bun run dev` | Starts Vite development server |
| `test` | `bun run test` | Runs Vitest unit test suite (8 test files, 13 tests) |
| `check` | `bun run check` | Runs Svelte template type checking (`svelte-check`) |
| `lint` | `bun run lint` | Runs Biome linter and static code analysis |
| `format` | `bun run format` | Auto-formats code with Biome |
| `build` | `bun run build` | Builds production client & server bundle |

---

## 🤖 Agentic AI Guidelines

Workspace agentic rules are defined in [`.agents/AGENTS.md`](file://./.agents/AGENTS.md). All AI assistants (Antigravity / Gemini) must maintain strict TDD unit test coverage and interface compliance when extending transit providers.
