"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const scanner_1 = require("./scanner");
const analyzer_1 = require("./analyzer");
const transformer_1 = require("./transformer");
const reporter_1 = require("./reporter");
function parseArgs(args) {
    return {
        srcDir: getArgValue(args, "--src", "./src"),
        dryRun: args.includes("--dry-run"),
        reportOnly: args.includes("--report-only"),
        verbose: args.includes("--verbose"),
    };
}
function getArgValue(args, key, defaultValue) {
    const index = args.indexOf(key);
    if (index === -1)
        return defaultValue;
    const value = args[index + 1];
    if (!value)
        return defaultValue;
    return value;
}
function run(args) {
    const options = parseArgs(args);
    console.log("🔥 heavy-imports-fix");
    console.log("Opções:", options, "\n");
    const files = (0, scanner_1.scanFiles)(options.srcDir);
    const results = files.map((file) => (0, analyzer_1.analyzeFile)(file, options));
    if (options.reportOnly) {
        (0, reporter_1.report)(results);
        return;
    }
    results.forEach((result) => {
        if (result.canTransform) {
            (0, transformer_1.transformFile)(result, options);
        }
    });
    console.log("\n✔ Finalizado");
}
