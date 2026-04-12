# STATUS

## Current state
- Branch: main
- Focus: Keep Angular route/layout structure maintainable while reducing production bundle size.
- Last updated: 2026-04-12
- Updated by: Codex
- Overall status: green

## In progress
- WEB-UI: continue replacing placeholder admin screens with real workflows
- WEB-UI: monitor remaining build optimization warning from Leaflet CommonJS packaging

## Blockers
- none for the current bundle-size work

## Recently completed
- split client and admin routes to lazy-loaded layout/page chunks
- reduced Angular production initial bundle from budget warning state to 304.22 kB
- verified production build after route splitting

## Waiting on
- backend and shared-client contract evolution for future admin pages
