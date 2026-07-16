import nickTwoBadFourU from "eslint-config-nick2bad4u";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...nickTwoBadFourU.configs.all,

    {
        files: ["src/**/*.ts"],
        rules: {
            "typefest/prefer-ts-extras-array-includes": "off",
            "typefest/prefer-ts-extras-array-join": "off",
            "typefest/prefer-ts-extras-is-defined": "off",
            "typefest/prefer-ts-extras-key-in": "off",
            "typefest/prefer-ts-extras-object-has-own": "off",
            "typefest/prefer-ts-extras-object-values": "off",
        },
    },
];

export default config;
