import { scanFiles } from "./scanner";
import { analyzeFile } from "./analyzer";
import { transformFile } from "./transformer";
import { report } from "./reporter";
import path from "path";
import fs from "fs"

export type Options = {
  srcDir: string;
  dryRun: boolean;
  reportOnly: boolean;
  verbose: boolean;
};

function parseArgs(args: string[]): Options {
  return {
    srcDir: getArgValue(args, "--src", "./src"),
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

  if (!options.dryRun) { // Só avisa se realmente alterou os arquivos
    try {
      const pkgJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = fs.readFileSync(pkgJsonPath, 'utf8');
        
        // Verifica se moment foi removido mas dayjs não foi instalado
        if (pkg.includes('"moment"') && !pkg.includes('"dayjs"')) {
          console.warn("\n[OTIMIZAÇÃO]: Detectamos a substituição de 'moment' por 'dayjs'.");
          console.warn("Por favor, execute: npm install dayjs");
        }
      }
    } catch (err) {
      console.error(err)
    }
  }


  console.log("\n✔ Finalizado");
}