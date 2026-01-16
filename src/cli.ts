#!/usr/bin/env node
import { run } from "./index";

function printHelp() {
  console.log(`
🔥 heavy-imports-fix

Uso:
  npx heavy-imports-fix [opções]

Opções:
  --src <dir>        Diretório base (default: ./src)
  --dry-run          Não escreve arquivos
  --report-only      Apenas relatório
  --verbose          Logs detalhados
  --help             Ajuda
`);
}

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

run(args);