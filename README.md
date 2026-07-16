# devskim-config-nick2bad4u

[![CI](https://github.com/Nick2bad4u/devskim-config-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/devskim-config-nick2bad4u/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/devskim-config-nick2bad4u.svg)](https://www.npmjs.com/package/devskim-config-nick2bad4u)

Portable shared [Microsoft DevSkim](https://github.com/microsoft/DevSkim) source-security policies with current serialized-option types, runtime validation, and composition helpers.

## Install

```sh
npm install --save-dev devskim-config-nick2bad4u
dotnet tool install --local Microsoft.CST.DevSkim.CLI --version 1.0.70
```

The npm package supplies policy only. Invoke the external .NET tool with an explicit source path:

```sh
dotnet devskim analyze \
  --source-code . \
  --options-json node_modules/devskim-config-nick2bad4u/.devskim.json
```

## Presets

| Preset    | Policy                                                             |
| --------- | ------------------------------------------------------------------ |
| `default` | High/medium confidence, human-readable output, normal suppressions |
| `strict`  | Includes low-confidence findings and returns an issue-count exit   |
| `audit`   | Strict confidence with comment suppressions disabled               |
| `ci`      | High/medium confidence SARIF report and issue-count exit           |
| `text`    | High-confidence-only human-readable local scan                     |

```sh
dotnet devskim analyze \
  --source-code src \
  --options-json node_modules/devskim-config-nick2bad4u/configs/ci.json
```

The CI preset writes `devskim-results.sarif` in the consumer working directory.

## Typed API

```ts
import {
 createDevSkimConfig,
 getDevSkimConfigPath,
 loadDevSkimConfig,
} from "devskim-config-nick2bad4u";

const auditPath = getDevSkimConfigPath("audit");
const nodePolicy = await createDevSkimConfig("strict", {
 Confidences: ["High", "Medium"],
});
```

Arrays replace their preset values. `LanguageRuleIgnoreMap` merges by exact embedded language name, such as `javascriptreact` or `typescriptreact`. Unknown preset names and malformed serialized options throw.

## Suppression policy

The shared files contain no rule ignores or repository-specific suppressions. Current DevSkim serialized analyze options do not support the historical `Suppressions` JSON array; use documented inline suppressions or the DevSkim `suppress` command in the consumer repository.

The package also omits obsolete cache, console, log, and depth properties that current DevSkim silently ignores.

## Development

```sh
npm install
npm run release:verify
```

Tests validate every raw JSON file, current option fields, absence of obsolete properties and shared ignores, preset semantics, composition behavior, runtime path errors, and packed assets.
