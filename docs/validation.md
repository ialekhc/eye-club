# Phase 1 validation record

Validated on 18 September 2026 (Asia/Kathmandu), Node 24.19.0, npm 11.17.0.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; zero warnings |
| `npm run typecheck` | Passed for engine, shared UI and web |
| `npm test` | 76 tests passed across eight suites |
| `npm run assets:setup` | Passed; versioned model SHA-256 verified |
| `npm run build` | Passed; Next.js 16.3.5 production Webpack build |
| Development server | Started successfully; `/try-on` rendered |
| Standalone production server | Started on port 3001; page and model returned HTTP 200 |
| `docker compose config --quiet` | Passed |
| Docker image/container execution | Not verified: Docker daemon unavailable |

## Browser checks executed

- Uploaded a single-face photo through the real file chooser, ran actual MediaPipe inference and reached the fitted Canvas result.
- Inspected the frame overlay visually; original black sample frame followed the eye line.
- Enabled and disabled landmark visualization; debug metrics displayed eye distance, signed head roll and face width.
- Uploaded a rotated public fixture to the standalone production build; fitting succeeded and reported approximately 11.3° roll.
- Uploaded a two-face composite; explicit multiple-face error appeared.
- Uploaded a blank image to the production build; explicit no-face error appeared.
- Uploaded a `.jpg` containing non-image bytes; signature validation rejected it.
- Reset cleared the output canvas to 0 × 0 and disabled landmark controls.
- Checked desktop/mobile layout bounds with viewport overrides; document scroll width matched viewport width. Inspected responsive stacking. Browser zoom affected reported CSS widths; overrides were restored afterward.

Browser testing is a smoke test, not a full cross-browser/device certification. No automated E2E suite, accessibility certification, physical fit accuracy benchmark, worker performance benchmark, backend or tenant-isolation test is claimed.

## Build environment note

The default Turbopack production build failed on a local process/port permission error. Next.js's supported Webpack production path passed and is now the committed default build script. No TypeScript or lint checks were disabled.

## Remaining limitations

Live camera and 3D AR are not implemented. Local object storage and the in-memory public rate limiter are intended for development or single-instance deployments; production should use managed S3-compatible storage and a shared limiter. Detection is synchronous CPU inference on the main thread, and the preview does not establish physical frame fit. Docker image execution still requires a host with Docker enabled.
