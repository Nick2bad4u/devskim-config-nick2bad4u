import { access, readFile } from "node:fs/promises";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import {
    createDevSkimConfig,
    devSkimConfigPath,
    devSkimConfigPaths,
    type DevSkimPreset,
    devSkimPresets,
    getDevSkimConfigPath,
    loadDevSkimConfig,
    parseDevSkimConfig,
} from "../src/devskim-config.js";

const ignoredLegacyKeys = [
    "CacheLocation",
    "ConsoleVerbosityLevel",
    "DisableConsoleOutput",
    "EnableCaching",
    "LogFileLevel",
    "LogFilePath",
    "MaxDepth",
    "Suppressions",
] as const;

describe("devSkim shared policy", () => {
    it.each(devSkimPresets)("loads the %s preset", async (preset) => {
        expect.hasAssertions();

        const configPath = getDevSkimConfigPath(preset);
        const source = await readFile(configPath, "utf8");
        const config = await loadDevSkimConfig(preset);

        await access(configPath);

        expect(path.isAbsolute(configPath)).toBe(true);
        expect(configPath).toBe(devSkimConfigPaths[preset]);
        expect(source.endsWith("\n")).toBe(true);
        expect(config.RespectGitIgnore).toBe(true);
        expect(config.IgnoreDefaultRules).toBe(false);
        expect(config.IgnoreRuleIds).toStrictEqual([]);
        expect(config.LanguageRuleIgnoreMap).toStrictEqual({});

        for (const key of ignoredLegacyKeys) {
            expect(config).not.toHaveProperty(key);
        }
    });

    it("keeps the default path conventional", () => {
        expect.assertions(2);

        expect(devSkimConfigPath).toBe(getDevSkimConfigPath("default"));
        expect(path.basename(devSkimConfigPath)).toBe(".devskim.json");
    });

    it("rejects unknown presets and malformed config", () => {
        expect.assertions(2);

        expect(() => getDevSkimConfigPath("invented" as DevSkimPreset)).toThrow(
            RangeError
        );
        expect(() => parseDevSkimConfig({})).toThrow(TypeError);
    });

    it("replaces arrays and merges language-specific maps", async () => {
        expect.assertions(4);

        const config = await createDevSkimConfig("default", {
            Confidences: ["High"],
            LanguageRuleIgnoreMap: {
                javascriptreact: ["DS999999"],
            },
            RuleIds: ["DS123456"],
        });

        expect(config.Confidences).toStrictEqual(["High"]);
        expect(config.RuleIds).toStrictEqual(["DS123456"]);
        expect(config.LanguageRuleIgnoreMap).toStrictEqual({
            javascriptreact: ["DS999999"],
        });
        expect(config.IgnoreRuleIds).toStrictEqual([]);
    });

    it("keeps audit and CI behavior explicit", async () => {
        expect.assertions(6);

        const audit = await loadDevSkimConfig("audit");
        const ci = await loadDevSkimConfig("ci");

        expect(audit.DisableSuppression).toBe(true);
        expect(audit.Confidences).toContain("Low");
        expect(audit.ExitCodeIsNumIssues).toBe(true);
        expect(ci.OutputFileFormat).toBe("sarif");
        expect(ci.OutputFile).toBe("devskim-results.sarif");
        expect(ci.ExitCodeIsNumIssues).toBe(true);
    });
});
