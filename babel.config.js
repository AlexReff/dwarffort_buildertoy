const presets = [
    [
        "@babel/preset-env",
        {
            targets: [">0.25%", "not ie 11"],
            useBuiltIns: "usage"
        },
    ],
];

const plugins = [
    "@babel/plugin-proposal-class-properties"
];

const ignore = [
    /\/core-js/,
];

module.exports = {
    sourceType: "unambiguous",
    ignore,
    presets,
    plugins,
};
