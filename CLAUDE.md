# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Root

The Next.js application lives in `school-room-booking/` — all source code, configs, and commands run from there. See `school-room-booking/CLAUDE.md` for full project documentation.

Two products share the same codebase:
- **Smart Room Booking** — interactive SVG maps, room availability, booking with admin approval
- **Smart Course Trading** — course swap marketplace with matching, proposals, chat

```bash
cd school-room-booking
bun dev              # Dev server at localhost:3000
bun run build        # Production build
bun run lint         # ESLint (flat config, ESLint 9)
```

## Code Review Rules

Claude must automatically review all written code for:
- **Simplification:** remove unnecessary abstractions and intermediate variables
- **Dead code:** remove unused imports, variables, and unreachable branches
- **Duplication:** extract shared logic only at 3+ occurrences
- **Lean functions:** ~40 line max, prefer early returns over deep nesting
- **Bundle size:** use tree-shakeable imports (e.g. `import { x } from 'lib'` not `import lib`)
- **Error handling:** consistent try/catch + console.error, never expose internal details to client
- **Type safety:** no `any`, keep dual type system (snake_case DB / camelCase frontend) in sync
