#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/scanner.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);

// src/utils/hasFileRecursive.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
function hasFileRecursive(dir, extensions) {
  const entries = import_fs.default.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = import_path.default.join(dir, entry.name);
    if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) return true;
    }
    if (entry.isDirectory()) {
      if (hasFileRecursive(fullPath, extensions)) return true;
    }
  }
  return false;
}

// src/scanner.ts
var VALID_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
function scanFiles(dir) {
  const result = [];
  function walk(current) {
    if (!import_fs2.default.existsSync(current)) return;
    const stat = import_fs2.default.statSync(current);
    if (stat.isDirectory()) {
      if (!hasFileRecursive(current, VALID_EXTENSIONS)) return;
      const entries = import_fs2.default.readdirSync(current);
      for (const entry of entries) {
        walk(import_path2.default.join(current, entry));
      }
      return;
    }
    if (stat.isFile() && VALID_EXTENSIONS.some((ext) => current.endsWith(ext))) {
      result.push(current);
    }
  }
  walk(dir);
  return result;
}

// src/analyzer.ts
var import_ts_morph = require("ts-morph");

// src/rules/heavyLibs.ts
var FORBIDDEN_NAMED_EXPORTS = [];
var heavyLibs = [
  "recharts",
  "react-chartjs-2",
  "chart.js",
  "echarts",
  "echarts-for-react",
  "victory",
  "nivo",
  "d3",
  "d3-*",
  "@mui/material",
  "@mui/icons-material",
  "antd",
  "semantic-ui-react",
  "primereact",
  "rsuite",
  "blueprintjs",
  "@chakra-ui/react",
  "react-big-calendar",
  "@fullcalendar/react",
  "@fullcalendar/core",
  "@fullcalendar/daygrid",
  "@fullcalendar/timegrid",
  "@fullcalendar/interaction",
  "moment",
  "moment-timezone",
  "luxon",
  "formik",
  "redux-form",
  "draft-js",
  "slate",
  "slate-react",
  "quill",
  "react-quill",
  "ckeditor4-react",
  "@ckeditor/ckeditor5-react",
  "redux",
  "@reduxjs/toolkit",
  "mobx",
  "mobx-react",
  "apollo-client",
  "@apollo/client",
  "leaflet",
  "react-leaflet",
  "mapbox-gl",
  "react-map-gl",
  "@heroicons/react",
  "react-icons",
  // "lodash",
  // "lodash-es",
  // "rxjs",
  "pdfjs-dist",
  "react-pdf",
  "video.js",
  "react-player",
  "three",
  "@react-three/fiber"
];
var UTILITY_LIBS = [
  "moment",
  "moment-timezone",
  "lodash",
  "lodash-es",
  "rxjs",
  "luxon",
  "axios"
  // "date-fns",
  // "date-fns-tz"
];

// src/analyzer.ts
var project = new import_ts_morph.Project();
function isHeavyLib(source) {
  return heavyLibs.some((lib) => {
    if (lib.endsWith("*")) {
      return source.startsWith(lib.replace("*", ""));
    }
    return source === lib || source.startsWith(`${lib}/`);
  });
}
function analyzeFile(file) {
  const sourceFile = project.addSourceFileAtPath(file);
  const heavyImports = [];
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDecl of importDeclarations) {
    const source = importDecl.getModuleSpecifierValue();
    if (!isHeavyLib(source)) continue;
    const isUtility = UTILITY_LIBS.some(
      (lib) => source === lib || source.startsWith(`${lib}/`)
    );
    const specifiers = [];
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      specifiers.push({
        local: defaultImport.getText(),
        type: "default"
      });
    }
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      specifiers.push({
        local: namedImport.getAliasNode()?.getText() || namedImport.getName(),
        imported: namedImport.getName(),
        type: "named"
      });
    }
    if (specifiers.length) {
      heavyImports.push({
        source,
        isUtility,
        specifiers
      });
    }
  }
  project.removeSourceFile(sourceFile);
  return {
    file,
    heavyImports
  };
}

// src/transformer.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_ts_morph2 = require("ts-morph");

// src/rules/substitutions.ts
var LIB_SUBSTITUTIONS = {
  "moment": {
    replaceWith: "dayjs",
    isUtility: true
  }
};

// src/transformer.ts
var project2 = new import_ts_morph2.Project();
var applyTransformations = (sourceFile, heavyImports) => {
  const grouped = /* @__PURE__ */ new Map();
  const utilityVars = /* @__PURE__ */ new Map();
  for (const imp of heavyImports) {
    const existing = grouped.get(imp.source) || [];
    grouped.set(imp.source, [...existing, ...imp.specifiers]);
    const isUtil = UTILITY_LIBS.some((lib) => imp.source === lib || imp.source.startsWith(`${lib}/`));
    if (isUtil) {
      imp.specifiers.forEach((s) => {
        const finalSource = LIB_SUBSTITUTIONS[imp.source]?.replaceWith || imp.source;
        utilityVars.set(s.local, { source: finalSource, isDefault: s.type === "default" });
      });
    }
  }
  sourceFile.getImportDeclarations().forEach((importDecl) => {
    const source = importDecl.getModuleSpecifierValue();
    const shouldRemove = grouped.has(source) || LIB_SUBSTITUTIONS[source] && LIB_SUBSTITUTIONS[source].isUtility;
    if (shouldRemove) {
      importDecl.remove();
    }
  });
  sourceFile.forEachDescendant((node) => {
    if (import_ts_morph2.Node.isCallExpression(node)) {
      const callExpression = node;
      const identifier = callExpression.getExpression();
      if (import_ts_morph2.Node.isIdentifier(identifier) && utilityVars.has(identifier.getText())) {
        const info = utilityVars.get(identifier.getText());
        let parentNode = callExpression.getParent();
        while (parentNode) {
          if (import_ts_morph2.Node.isFunctionDeclaration(parentNode) || import_ts_morph2.Node.isArrowFunction(parentNode) || import_ts_morph2.Node.isMethodDeclaration(parentNode) || import_ts_morph2.Node.isFunctionExpression(parentNode)) {
            parentNode.setIsAsync(true);
            break;
          }
          parentNode = parentNode.getParent();
        }
        const replacementText = `(await import('${info.source}')).${info.isDefault ? "default" : identifier.getText()}`;
        const argsText = callExpression.getArguments().map((arg) => arg.getText()).join(", ");
        callExpression.replaceWithText(`${replacementText}(${argsText})`);
      }
    }
  });
  const hasComponents = Array.from(grouped.keys()).some((src) => !UTILITY_LIBS.includes(src));
  if (hasComponents && !sourceFile.getImportDeclaration("next/dynamic")) {
    const useClientDirective = sourceFile.getStatementsWithComments().find((s) => s.getText().includes("use client"));
    const importIndex = useClientDirective ? 1 : 0;
    sourceFile.insertImportDeclaration(importIndex, {
      defaultImport: "dynamic",
      moduleSpecifier: "next/dynamic"
    });
  }
  const lastImportIndex = sourceFile.getImportDeclarations().length;
  let currentInsertIndex = lastImportIndex;
  for (const [src, specs] of grouped) {
    if (UTILITY_LIBS.includes(src)) continue;
    for (const s of specs) {
      if (s.type === "named" && FORBIDDEN_NAMED_EXPORTS.includes(s.local)) continue;
      const importExpression = s.type === "default" ? `import('${src}')` : `import('${src}').then(m => m.${s.imported})`;
      const originalType = s.type === "default" ? `typeof import('${src}').default` : `typeof import('${src}').${s.imported}`;
      const dynamicCallText = `dynamic(() => ${importExpression}, { ssr: false }) as unknown as ${originalType}`;
      sourceFile.insertVariableStatement(currentInsertIndex, {
        declarationKind: import_ts_morph2.VariableDeclarationKind.Const,
        declarations: [{
          name: s.local,
          initializer: dynamicCallText
        }],
        leadingTrivia: (writer) => currentInsertIndex === lastImportIndex ? writer.blankLine() : writer.write("")
      });
      currentInsertIndex++;
    }
  }
};
function transformFile(result, options) {
  const sourceFile = project2.addSourceFileAtPath(result.file);
  applyTransformations(sourceFile, result.heavyImports);
  const out = sourceFile.getFullText();
  if (options.dryRun) {
    console.log(`\u{1F9EA} DRY-RUN: ${result.file}`);
    project2.removeSourceFile(sourceFile);
    return;
  }
  import_fs3.default.writeFileSync(result.file, out, "utf8");
  project2.removeSourceFile(sourceFile);
  if (options.verbose) {
    console.log(`\u270F\uFE0F  ${result.file}`);
  }
}

// src/reporter.ts
function report(results) {
  const withHeavy = results.filter(
    (r) => r.heavyImports.length > 0
  );
  console.log("\n\u{1F4CA} Relat\xF3rio");
  console.log(`Arquivos analisados: ${results.length}`);
  console.log(`Arquivos com imports pesados: ${withHeavy.length}
`);
  withHeavy.forEach((r) => {
    console.log(`\u{1F4C4} ${r.file}`);
    r.heavyImports.forEach(
      (lib) => console.log(`   - ${lib}`)
    );
  });
}

// src/index.ts
var import_path3 = __toESM(require("path"), 1);
var import_fs4 = __toESM(require("fs"), 1);
function parseArgs(args2) {
  return {
    srcDir: getArgValue(args2, "--src", "./src"),
    dryRun: args2.includes("--dry-run"),
    reportOnly: args2.includes("--report-only"),
    verbose: args2.includes("--verbose")
  };
}
function getArgValue(args2, key, defaultValue) {
  const index = args2.indexOf(key);
  return index !== -1 && args2[index + 1] ? args2[index + 1] : defaultValue;
}
function run(args2) {
  const options = parseArgs(args2);
  console.log("\u{1F525} heavy-imports-fix");
  console.log("Op\xE7\xF5es:", options, "\n");
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
  if (!options.dryRun) {
    try {
      const pkgJsonPath = import_path3.default.join(process.cwd(), "package.json");
      if (import_fs4.default.existsSync(pkgJsonPath)) {
        const pkg = import_fs4.default.readFileSync(pkgJsonPath, "utf8");
        if (pkg.includes('"moment"') && !pkg.includes('"dayjs"')) {
          console.warn("\n[OTIMIZA\xC7\xC3O]: Detectamos a substitui\xE7\xE3o de 'moment' por 'dayjs'.");
          console.warn("Por favor, execute: npm install dayjs");
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  console.log("\n\u2714 Finalizado");
}

// src/cli.ts
function printHelp() {
  console.log(`
\u{1F525} heavy-imports-fix

Uso:
  heavy-imports-fix [op\xE7\xF5es]

Op\xE7\xF5es:
  --src <dir>        Diret\xF3rio base (default: ./src)
  --dry-run          N\xE3o escreve arquivos
  --report-only      Apenas relat\xF3rio
  --verbose          Logs detalhados
  --help | -h        Ajuda
`);
}
var args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}
run(args);
