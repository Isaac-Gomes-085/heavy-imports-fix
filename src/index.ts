import { scanFiles } from "./scanner";
import { analyzeFile } from "./analyzer";
import { transformFile } from "./transformer";
import { report } from "./reporter";

export type Options = {
  srcDir: string;
  dryRun: boolean;
  reportOnly: boolean;
  verbose: boolean;
};

function parseArgs(args: string[]): Options {
  return {
    srcDir: getArgValue(args, "--app", "./app"),
    dryRun: args.includes("--dry-run"),
    reportOnly: args.includes("--report-only"),
    verbose: args.includes("--verbose"),
  };
}

function getArgValue(args: string[], key: string, defaultValue: string): string {
  const index = args.indexOf(key);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
}

export function run(args: string[]) {
  const options = parseArgs(args);

  console.log("🔥 heavy-imports-fix");
  console.log("Opções:", options, "\n");

  const files = scanFiles(options.srcDir);
  const results = files.map((file) => analyzeFile(file));

  if (options.reportOnly) {
    report(results);
    return;
  }

  for (const result of results) {
    if (result.heavyImports.length > 0) {
      transformFile(result, options);
    }
  }

  console.log("\n✔ Finalizado");
}