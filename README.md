# Roosevelt Island Transit (Svelte 5 Base)

A modern full-stack web application base powered by **Bun v1.3**, **SvelteKit 2**, **Svelte 5 Runes**, **Tailwind CSS v4**, **Hugeicons**, and **Biome v2.3**. Fully aligned with 2026 recommended best practices.

## 🚀 Repositories

- **Project Repository**: [EthanPrintz/roosevelt-island-transit](https://github.com/EthanPrintz/roosevelt-island-transit)
- **Base Template**: [EthanPrintz/svelte-base](https://github.com/EthanPrintz/svelte-base)

---

## ✨ Features & Architecture

- **Bun v1.3 Runtime**: Ultra-fast package management, native worker support, and script execution.
- **Svelte 5 Runes**: Next-gen fine-grained reactivity using `$state`, `$derived`, `$props`, and `<snippet>` template composition.
- **Tailwind CSS v4**: CSS-first design system with `@theme` block in `src/app.css` using perceptually uniform **OKLCH** color tokens.
- **Roosevelt Island Tram Theme**: Primary brand scale styled with the iconic Roosevelt Island Tram crimson red.
- **Declarative Theme Switcher**: Instant light, dark, and system preference toggling using a reactive `$state` store in `src/lib/state/theme.svelte.ts` with zero FOUC on page load.
- **Hugeicons Integration**: Vector icon components powered by `@hugeicons/svelte` and `@hugeicons/core-free-icons`.
- **Biome v2.3 Tooling**: High-performance linting, import sorting, and code formatting.
- **Agentic Guidelines**: Dedicated workspace configuration in `.agents/AGENTS.md` for AI coding assistants (Antigravity / Gemini).

---

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/EthanPrintz/roosevelt-island-transit.git
cd roosevelt-island-transit

# Install dependencies
bun install

# Start local development server
bun run dev
```

---

## 📜 Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `bun run dev` | Starts Vite development server |
| `build` | `bun run build` | Builds SvelteKit client and server production bundle |
| `preview` | `bun run preview` | Previews production build locally |
| `check` | `bun run check` | Runs Svelte template type checking (`svelte-check`) |
| `lint` | `bun run lint` | Runs Biome linter and static code analysis |
| `format` | `bun run format` | Auto-formats code with Biome |
| `test` | `bun run test` | Runs unit test suite with Vitest |

---

## 🤖 Agentic AI Configuration

This project includes agentic instructions for Antigravity / Gemini AI assistants located in [`.agents/AGENTS.md`](file://./.agents/AGENTS.md). 

When contributing with AI pair programmers, ensure that:
1. Svelte 5 Runes (`$state`, `$derived`, `$props`) are strictly preferred over legacy Svelte 4 syntax.
2. Styling modifications are added to `src/app.css` under the `@theme` directive using CSS variables.
3. Code formatting and linting pass clean via `bun run lint && bun run check`.
