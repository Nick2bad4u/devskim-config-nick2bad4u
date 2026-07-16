import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Confidence values accepted by the DevSkim CLI. */
export type DevSkimConfidence =
    | "High"
    | "Low"
    | "Medium";

/** Current serialized analyze options intentionally supported by this package. */
export interface DevSkimOptions {
    readonly AbsolutePaths: boolean;
    readonly BasePath: string;
    readonly CommentsPath: string;
    readonly Confidences: readonly DevSkimConfidence[];
    readonly CrawlArchives: boolean;
    readonly DisableParallel: boolean;
    readonly DisableSuppression: boolean;
    readonly ExitCodeIsNumIssues: boolean;
    readonly Globs: readonly string[];
    readonly IgnoreDefaultRules: boolean;
    readonly IgnoreRuleIds: readonly string[];
    readonly LanguageRuleIgnoreMap: Readonly<Record<string, readonly string[]>>;
    readonly LanguagesPath: string;
    readonly OutputFile: string;
    readonly OutputFileFormat:
        | "sarif"
        | "text"
        | "vs";
    readonly OutputTextFormat: string;
    readonly RespectGitIgnore: boolean;
    readonly RuleIds: readonly string[];
    readonly Rules: readonly string[];
    readonly Severities: readonly DevSkimSeverity[];
    readonly SkipExcerpts: boolean;
}

/** Supported DevSkim policy presets. */
export type DevSkimPreset =
    | "audit"
    | "ci"
    | "default"
    | "strict"
    | "text";

/** Severity values accepted by the DevSkim CLI. */
export type DevSkimSeverity =
    | "BestPractice"
    | "Critical"
    | "Important"
    | "ManualReview"
    | "Moderate";

type UnknownRecord = Record<PropertyKey, unknown>;

/** All bundled DevSkim policy preset names. */
export const devSkimPresets: readonly DevSkimPreset[] = Object.freeze([
    "default",
    "strict",
    "audit",
    "ci",
    "text",
]);

const paths: Readonly<Record<DevSkimPreset, string>> = Object.freeze({
    audit: fileURLToPath(new URL("../configs/audit.json", import.meta.url)),
    ci: fileURLToPath(new URL("../configs/ci.json", import.meta.url)),
    default: fileURLToPath(new URL("../.devskim.json", import.meta.url)),
    strict: fileURLToPath(new URL("../configs/strict.json", import.meta.url)),
    text: fileURLToPath(new URL("../configs/text.json", import.meta.url)),
});

/** Absolute path to the default `.devskim.json`. */
export const devSkimConfigPath: string = paths.default;

/** Immutable mapping from preset names to package-owned absolute paths. */
export const devSkimConfigPaths: Readonly<Record<DevSkimPreset, string>> =
    paths;

const confidenceValues: readonly DevSkimConfidence[] = [
    "High",
    "Medium",
    "Low",
];
const severityValues: readonly DevSkimSeverity[] = [
    "Critical",
    "Important",
    "Moderate",
    "BestPractice",
    "ManualReview",
];

/** Create a preset-derived config; arrays replace and language maps merge. */
export async function createDevSkimConfig(
    preset: DevSkimPreset = "default",
    overrides: Partial<DevSkimOptions> = {}
): Promise<DevSkimOptions> {
    const base = await loadDevSkimConfig(preset);
    return parseDevSkimConfig({
        ...base,
        ...overrides,
        LanguageRuleIgnoreMap: {
            ...base.LanguageRuleIgnoreMap,
            ...overrides.LanguageRuleIgnoreMap,
        },
    });
}

/** Validate a programmatically defined DevSkim config. */
export function defineDevSkimConfig(config: DevSkimOptions): DevSkimOptions {
    return parseDevSkimConfig(config);
}

/**
 * Resolve one bundled DevSkim config to an absolute filesystem path.
 *
 * @throws RangeError if `preset` is not a bundled preset name.
 */
export function getDevSkimConfigPath(
    preset: DevSkimPreset = "default"
): string {
    switch (preset) {
        case "audit":
        case "ci":
        case "default":
        case "strict":
        case "text": {
            return paths[preset];
        }
        default: {
            throw new RangeError(
                "Unknown DevSkim preset. Expected one of: default, strict, audit, ci, text."
            );
        }
    }
}

/** Load and validate one bundled DevSkim config. */
export async function loadDevSkimConfig(
    preset: DevSkimPreset = "default"
): Promise<DevSkimOptions> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The resolver returns only package-owned preset paths.
    const source = await readFile(getDevSkimConfigPath(preset), "utf8");
    return parseDevSkimConfig(JSON.parse(source));
}

/**
 * Validate unknown input as a current serialized DevSkim analyze config.
 *
 * @throws TypeError if the input does not contain current DevSkim options.
 */
export function parseDevSkimConfig(value: unknown): DevSkimOptions {
    if (!isRecord(value)) {
        throw new TypeError(
            "Expected the DevSkim configuration to be an object."
        );
    }

    const stringFields = [
        "BasePath",
        "CommentsPath",
        "LanguagesPath",
        "OutputFile",
        "OutputTextFormat",
    ] as const;
    const booleanFields = [
        "AbsolutePaths",
        "CrawlArchives",
        "DisableParallel",
        "DisableSuppression",
        "ExitCodeIsNumIssues",
        "IgnoreDefaultRules",
        "RespectGitIgnore",
        "SkipExcerpts",
    ] as const;

    if (
        stringFields.some((field) => typeof value[field] !== "string") ||
        booleanFields.some((field) => typeof value[field] !== "boolean") ||
        !hasOnlyValues(value["Confidences"], confidenceValues) ||
        !hasOnlyValues(value["Severities"], severityValues) ||
        !isStringArray(value["Globs"]) ||
        !isStringArray(value["IgnoreRuleIds"]) ||
        !isStringArray(value["RuleIds"]) ||
        !isStringArray(value["Rules"]) ||
        !isLanguageMap(value["LanguageRuleIgnoreMap"]) ||
        !isOutputFileFormat(value["OutputFileFormat"])
    ) {
        throw new TypeError("Invalid serialized DevSkim analyze options.");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Every serialized field has been checked above.
    return value as unknown as DevSkimOptions;
}

function hasOnlyValues<T extends string>(
    value: unknown,
    allowed: readonly T[]
): value is readonly T[] {
    return (
        isStringArray(value) &&
        value.every((item) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The predicate checks membership before exposing the generic type.
            allowed.includes(item as T)
        )
    );
}

function isLanguageMap(
    value: unknown
): value is Readonly<Record<string, readonly string[]>> {
    return (
        isRecord(value) &&
        Object.values(value).every((ruleIds) => isStringArray(ruleIds))
    );
}

function isOutputFileFormat(
    value: unknown
): value is DevSkimOptions["OutputFileFormat"] {
    switch (value) {
        case "sarif":
        case "text":
        case "vs": {
            return true;
        }
        default: {
            return false;
        }
    }
}

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
    return (
        Array.isArray(value) && value.every((item) => typeof item === "string")
    );
}

export default devSkimConfigPath;
