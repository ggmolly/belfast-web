# AGENTS.md

This file is for agentic coding assistants working in this repo.
Keep changes small, consistent with existing patterns, and prefer readable, typed code.

## Project Overview
- Frontend: React 19 + TypeScript + Vite (rolldown-vite).
- UI: Tailwind CSS + lucide-react icons.
- Data: TanStack Query/Router/Form/Table/Virtual.
- Lint/format: Biome.

## Build / Lint / Test Commands

### Install
- `bun i`

### Dev server
- `bun dev`

### Build
- `bun run build`

### Preview production build
- `bun run preview`

### Lint
- `bun run lint` (Biome lint for entire repo)
- Single-path lint: `bunx biome lint src/pages/Players.tsx`

### Format
- `bun run format` (Biome format for entire repo)
- Format single file: `bunx biome format src/pages/System.tsx --write`

### Check (lint + format + more)
- `bun run check`
- Fix issues: `bun run fix`

### Tests
- No test runner configured yet.
- If adding tests later, document how to run a single test in this file.

## Repo Rules Check
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.
- If these are added later, copy their requirements here.

## Coding Style Guidelines

### Principles
- Prefer KISS and DRY: keep solutions simple and avoid duplication.
- Type safety first: add types when they improve clarity or prevent bugs.
- Avoid defensive programming unless required by an API boundary or spec.
- Avoid abusive `useMemo`; use it only for expensive computations or stable references.

### Formatting
- Use tabs for indentation (see `biome.json`).
- Single quotes, trailing commas where possible, semicolons as needed.
- Target line length: 120.

### Imports
- Keep imports grouped by source:
  1) External libs
  2) Internal components/utilities
  3) Types (use `import type` when only types)
- Prefer named imports; avoid default unless necessary.

### Naming
- React components: `PascalCase`.
- Hooks: `useX`.
- Variables/functions: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` for enums/const maps when global-like.

### TypeScript
- Prefer explicit types for public API boundaries and complex data structures.
- Avoid `any` and unsafe casts.
- Use `import type` for types-only imports.
- Keep type definitions in `src/types.ts` when shared.

### React
- Use function components and hooks.
- Keep derived state in `useMemo` when expensive.
- Avoid defensive checks unless required by an API boundary or spec.

### Data Fetching (TanStack Query)
- Use `useQuery` for reads and `useMutation` for writes.
- Invalidate relevant queries after mutations.
- Prefer `refetchInterval` for periodic refreshes.
- Use stable query keys that include filter params.

### Routing (TanStack Router)
- Route config is in `src/router.tsx`.
- Use `useNavigate` with typed routes/params.

### Forms (TanStack Form)
- Use `useForm` with strongly typed fields.
- Use `form.Field` and `form.Subscribe` for reactive sections.

### Tables & Virtualization
- Use `@tanstack/react-table` for column definitions.
- Use `@tanstack/react-virtual` for large tables.
- Keep table layout stable (`table-fixed`, width classes) when using virtual rows.

### UI & Styling
- Use Tailwind utility classes; match existing component patterns.
- Keep UI consistent with `src/components/ui/*` primitives.
- Use `SearchableSelect` for drop-aware lookups.
- Prefer `Button`, `Card`, `Input`, `Modal`, `Badge` primitives.

### Error Handling
- Throw or surface errors from API calls; avoid silent failures.
- Keep error handling minimal unless specified.

### API Client
- Centralized in `src/services/api.ts`.
- Add endpoints there with typed request/response shapes in `src/types.ts`.

## Common Tasks

### Add a new page
1) Create page under `src/pages/`.
2) Register route in `src/router.tsx`.
3) Add nav item in `src/components/Layout.tsx` if needed.

### Add a new API endpoint
1) Add types to `src/types.ts`.
2) Add method to `src/services/api.ts`.
3) Wire into page with TanStack Query.

### Add a new drop type to SearchableSelect
1) Add type to `DROP_TYPES` map.
2) Add label/badge color mapping.
3) Include options in your page’s `dropOptions` array.

## Notes
- This repo uses Bun. Avoid npm/yarn commands.
- Keep diffs focused. No unrelated refactors.
