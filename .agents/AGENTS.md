# Agentic Guidelines & Engineering Best Practices (.agents/AGENTS.md)

This workspace is configured for Antigravity / Gemini coding agents. All agents MUST follow these instructions and rules when operating within this codebase.

## 1. Core Principles
- **No Guesswork**: Do not guess file paths, symbol names, or API signatures. Verify using workspace tools.
- **Runtime & Package Manager**: Always use `bun` (v1.3+). Use `bun install`, `bun run dev`, `bun run check`, `bun run lint`, `bun run format`, `bun run test`.
- **Type Safety**: Maintain strict TypeScript v5.9 definitions.

## 2. Framework Guidelines: Svelte 5 & SvelteKit 2
- **Runes**:
  - Use `$state` for all reactive state.
  - Use `$derived` for computed expressions. Avoid complex logic inside templates.
  - Use `$props` for component prop interfaces instead of legacy `export let`.
  - Use `<snippet>` over `<slot>` for template slots.
- **Event Handling**: Use standard HTML attributes (e.g., `onclick`, `onkeydown`) instead of legacy `on:` directives.
- **Global Client State**: Store shared client state in `.svelte.ts` modules (e.g. `src/lib/state/theme.svelte.ts`) using `$state` runes instead of writable stores.
- **Data Loading & Form Actions**:
  - Use `+page.server.ts` for server-only logic and DB queries.
  - Apply `use:enhance` on form elements for progressive enhancement.

## 3. Styling & Design System: Tailwind CSS v4
- **CSS-First Architecture**: Define design system tokens directly in `src/app.css` using the `@theme` directive.
- **OKLCH Color Tokens**: Layer raw OKLCH values to semantic variables (`--color-bg-base`, `--color-bg-surface`, `--color-text-main`, `--color-primary`).
- **Declarative Theme Switching**: Theme modes (`system`, `light`, `dark`) operate via `document.documentElement.dataset.theme` and native `@media (prefers-color-scheme: dark)`.

## 4. Icon System: Hugeicons
- Use `@hugeicons/svelte` for rendering icon components (`<HugeiconsIcon icon={IconName} size={20} />`).
- Import free icons from `@hugeicons/core-free-icons`.
- Consult the `hugeicons` MCP server when looking for available vector icon glyphs.

## 5. Data Pipeline & Suppression Rules
- **Dynamic Active Horizon Suppression**: When combining static GTFS schedules with real-time feeds (GTFS-RT / Connexionz), ALWAYS use `suppressGhostSchedules()` from `src/lib/transit/utils/suppression.ts`. Suppress any static departure scheduled earlier than or equal to $T_{\text{max\_live}}$ in that direction.
- **Hero Card Design System**: HeroDepartureCards follow a strict 3-row architecture (Top Bar: status pill + countdown; Middle Row: destination title + clock time; Bottom Row: mono sub-details line). All status pills MUST use mode accent colors (`orange`, `rose`, `cyan`) with translucent backgrounds and `border border-[color]/30`.

## 6. Tooling, Linting & Verification
- **Linter & Formatter**: Biome v2.3 (`bun run lint`, `bun run format`).
- **Type Diagnostics**: Svelte Check (`bun run check`).
- **Unit Testing**: Vitest (`bun run test`).
- Always run `bun run check && bun run lint && bun run test` before declaring code changes complete.

## 7. Test-Driven Development (TDD) Mandates & Workflow
All agents and developers MUST follow strict TDD principles when adding features, modifying algorithms, or fixing bugs:

- **Red-Green-Refactor Cycle**:
  1. **Red**: Write unit tests (`*.test.ts` or `*.svelte.test.ts`) that fail BEFORE implementing new functions, providers, or endpoints.
  2. **Green**: Implement the minimal, clean solution necessary to make the tests pass.
  3. **Refactor**: Clean up and optimize while ensuring all tests stay green.
- **Testing Architecture & Tooling**:
  - **Runtime & Manager**: Use `bun` (v1.3+) for execution, scripts, and dependency management.
  - **Test Runner**: Use **Vitest** (`bun run test`) as the standard test runner. Vitest shares Vite's build pipeline, ensuring seamless compilation of Svelte 5 runes (`$state`, `$derived`), `$lib/*` aliases, and component mounting.
- **Testing Requirements by Layer**:
  1. **Pure Domain Logic & Utilities**: Every helper in `$lib/utils/` or `$lib/transit/utils/` must have a corresponding `.test.ts` file covering happy paths, edge cases, and empty inputs.
  2. **Transit Providers**: New or modified providers implementing `TransitProvider` MUST include contract tests verifying `getDepartures`, `getAlerts`, `getVehicles`, and `getBikeStations`, plus error boundary fallback on network failures.
  3. **Svelte 5 State Runes**: Shared `.svelte.ts` state modules (e.g. `src/lib/state/theme.svelte.ts`) must test reactive property getters/setters and state mutations.
  4. **Server Endpoints & Load Functions**: SvelteKit API endpoints (`+server.ts`) and server load functions (`+page.server.ts`) must have co-located `+server.test.ts` / `+page.server.test.ts` unit tests verifying request parameter parsing, caching (`serverCache`), response payload structure, and HTTP headers (`Cache-Control`).
  5. **UI Components**: Components in `$lib/components/` must have co-located unit/integration tests verifying 3-row hero card layouts, prop reactivity, theme state interaction, and accessible user callbacks.
- **Mocking Guidelines**:
  - Store reusable JSON data fixtures under `src/lib/transit/fixtures/`.
  - Use `vi.spyOn(globalThis, 'fetch')` or `vi.fn()` for network mocking; avoid monkey-patching globals directly.
  - Never swallow errors silently in tests or production code.

