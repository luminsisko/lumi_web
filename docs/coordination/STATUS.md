# STATUS

## Current state
- Branch: main
- Focus: Keep Angular route/layout structure maintainable while aligning map features with backend geospatial endpoints.
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
- added `GET /api/weather-regions` client support with tolerant normalization for wrapped arrays, points, bboxes, and GeoJSON-like geometry
- updated the client map to default to Helsinki and render Helsinki weather regions on load
- refactored admin places into a map-first page with Helsinki weather-region borders and region selection by map click
- updated `GET /api/weather-regions` usage to the latest contract using `boundary.coordinates[0]`, `[lon, lat]`, `region_id`, `area_slug`, `center_lat`, and `center_lon`
- separated client and admin map behavior so weather-region visualization remains admin-only while the client map shows weather, astronomy, and places on click

## Waiting on
- backend and shared-client contract evolution for future admin pages
