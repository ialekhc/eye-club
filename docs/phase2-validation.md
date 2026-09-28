# Phase 2 validation record

Phase 2 adds two original calibrated sample frames, a transparent PNG/WebP asset importer, IndexedDB frame storage, an anchor editor, live calibration preview, frame switching and temporary manual fit controls.

Validated locally:

- `npm test`: 69 tests passed across four suites, including calibration pointer normalization, transparent asset checks, versioned storage records and manual correction math.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed for the engine, UI and web application.
- `npm run build`: passed using the committed Next.js Webpack production build.
- Browser smoke test: single-face fixture fitted; switching to The Weekender updated the Canvas without rerunning face detection; calibration dialog opened with three draggable/keyboard-editable anchors and a live photo preview.
- Invalid calibration values are blocked before save. Saved frame records contain only the asset Blob, checksum, dimensions and calibration; transient object URLs, DOM images, photo pixels and landmarks are excluded.

The frame library currently uses browser IndexedDB as a safe Phase 2 stand-in for merchant persistence. Uploaded assets are validated for PNG/WebP signature, dimensions, size, visible pixels and transparent background. A saved frame is accepted only when its current bytes match the SHA-256 hash stored with calibration. The removal action deletes only a recoverable local frame record and object URL; built-in samples cannot be removed.

The next phase should replace this local storage adapter with authenticated organization-scoped API calls and signed object-storage uploads, while retaining the same `LoadedFrame`/calibration contract.
