# CROSS-REPO IMPACT

## Contract ownership
Web UI owns browser rendering, forms, and navigation. It does not own business rules, final authorization checks, or canonical error taxonomy.

## Shared assumptions to keep aligned
- auth token format and renewal rules
- error envelope shape and stable machine-readable error codes
- pagination, filtering, sorting, and timestamp semantics
- locale and timezone handling
- idempotency or retry behavior for writes
- file upload or media handling if present
- `GET /api/weather-regions` response shape for region geometry or bounding boxes

## Client matrix
| Capability | Backend | Web | Mobile | Embedded |
|---|---|---|---|---|
| Canonical business rules | yes | no | no | no |
| Rich admin UI | no | yes | limited | no |
| Offline-first behavior | no | limited | yes | likely yes |
| Push/background workflows | no | limited | yes | platform-specific |
| Compact protocol pressure | medium | low | medium | high |

## Repository-specific note
Web UI owns browser rendering, forms, and navigation. It does not own business rules, final authorization checks, or canonical error taxonomy.

## Current contract note
The web client now expects `GET /api/weather-regions` to provide `regions`, where each region uses `region_id`, `area_slug`, `center_lat`, `center_lon`, and `boundary.coordinates[0]` with coordinates in `[lon, lat]` order.
The web client also expects `GET /api/places/local-nearby` to return `experience_kind`, `is_always_open`, `opening_hours_raw`, and `hours_note`, with tag fields as comma-separated strings rather than arrays.
