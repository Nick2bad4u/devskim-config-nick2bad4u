# Repository Instructions

This repository publishes `devskim-config-nick2bad4u`. Treat `.devskim.json`, every file under `configs/`, and the typed parser/composition API as public package surfaces.

## Priorities

- Support only fields in current `SerializedAnalyzeCommandOptions`.
- Never add broad shared rule ignores or consumer-specific suppressions.
- Keep embedded DevSkim language names exact.
- Preserve normal inline suppressions except in the explicitly named audit preset.
- Validate configs with the official DevSkim CLI when available.
- This package supplies configuration only; it must not claim to install DevSkim.

## Commands

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```
