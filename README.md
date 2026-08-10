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
src/
├── lib/
│   ├── components/              # UI Components & Unit Tests (SegmentedControl.test.ts, HeroDepartureCard.test.ts, etc.)
│   ├── server/                  # Server-side cache & GTFS parser + tests (cache.test.ts, gtfs-static.test.ts)
│   ├── state/                   # Svelte 5 Runes State Modules (theme.svelte.ts & theme.test.ts)
│   └── transit/
│       ├── domain/              # Core Contracts (provider.ts, types.ts)
│       ├── fixtures/            # Mock JSON Fixtures for TDD & Deterministic UI (tram.json, subway.json, etc.)
│       ├── providers/           # Live Hybrid & Mock Providers + Provider Contract Tests
│       ├── utils/               # Data Pipeline Utilities & Tests (suppression.ts, status-pill.ts)
│       └── aggregator/          # Aggregator Orchestrator & Tests (TransitAggregator.ts)
└── routes/
    └── api/
        └── transit/             # API Endpoints & Server Tests (+server.ts & +server.test.ts)
```

---

## 🧪 Test-Driven Development (TDD) Guidelines

This project uses **Bun v1.3** as the runtime and package runner, and **Vitest** as the Vite-native test runner.

### Running Tests

```bash
# Run full unit, contract, server endpoint, and component test suite
bun run test

# Run tests in watch mode during development
bun run test -- --watch

# Run static checks and linter alongside tests before committing
bun run check && bun run lint && bun run test
```

### TDD Execution Strategy

1. **Write Tests First (Red)**: Create or update `*.test.ts` / `*.svelte.test.ts` before implementing new utilities, providers, runes state, or server endpoints.
2. **Implement Minimal Code (Green)**: Fulfill the test requirements cleanly.
3. **Refactor & Verify (Refactor)**: Verify strict type checks (`bun run check`), static analysis (`bun run lint`), and tests (`bun run test`).

### Testing Layers & Conventions

- **Providers**: Every `TransitProvider` implementation must conform to the contract helper (`contract-helper.test.ts`) and test empty responses and fetch failures gracefully.
- **Server Endpoints**: SvelteKit API endpoints (`+server.ts`) must have co-located `+server.test.ts` verifying parameter sanitization, `serverCache` behavior, and `Cache-Control` response headers.
- **Runes State**: Shared reactive state (`.svelte.ts`) must test `$state` / `$derived` mutations and theme applications.
- **UI Components**: Components in `src/lib/components/` must verify 3-row architecture rendering, prop updates, and click handlers.

---

## 📜 Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `bun run dev` | Starts Vite development server |
| `test` | `bun run test` | Runs Vitest unit, contract, server, & component test suite |
| `check` | `bun run check` | Runs Svelte template type checking (`svelte-check`) |
| `lint` | `bun run lint` | Runs Biome linter and static code analysis |
| `format` | `bun run format` | Auto-formats code with Biome |
| `build` | `bun run build` | Builds production client & server bundle |

---

## 🤖 Agentic AI Guidelines

Workspace agentic rules are defined in [`.agents/AGENTS.md`](file://./.agents/AGENTS.md). All AI assistants (Antigravity / Gemini) must maintain strict TDD unit test coverage, interface compliance, and dynamic suppression rules when extending transit providers.

