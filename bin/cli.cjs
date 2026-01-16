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
var import_fs3 = __toESM(require("fs"), 1);
var import_parser = require("@babel/parser");
var import_traverse = __toESM(require("@babel/traverse"), 1);
var t = __toESM(require("@babel/types"), 1);

// src/rules/heavyLibs.ts
var FORBIDDEN_NAMED_EXPORTS = [
  "Tooltip",
  "Legend",
  "ResponsiveContainer",
  "Cell",
  "CartesianGrid",
  "XAxis",
  "YAxis"
];
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
  "date-fns-tz",
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
  "lodash",
  "lodash-es",
  "rxjs",
  "pdfjs-dist",
  "react-pdf",
  "video.js",
  "react-player",
  "three",
  "@react-three/fiber"
];

// src/analyzer.ts
var traverse = import_traverse.default.default ?? import_traverse.default;
function isHeavyLib(source) {
  return heavyLibs.some((lib) => {
    if (lib.endsWith("*")) {
      return source.startsWith(lib.replace("*", ""));
    }
    return source === lib || source.startsWith(`${lib}/`);
  });
}
function analyzeFile(file) {
  const code = import_fs3.default.readFileSync(file, "utf8");
  const ast = (0, import_parser.parse)(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"]
  });
  const heavyImports = [];
  traverse(ast, {
    ImportDeclaration(path3) {
      const source = path3.node.source.value;
      if (!isHeavyLib(source)) return;
      const specifiers = [];
      for (const spec of path3.node.specifiers) {
        if (t.isImportDefaultSpecifier(spec)) {
          specifiers.push({
            local: spec.local.name,
            type: "default"
          });
        }
        if (t.isImportSpecifier(spec)) {
          specifiers.push({
            local: spec.local.name,
            imported: t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value,
            type: "named"
          });
        }
      }
      if (specifiers.length) {
        heavyImports.push({
          source,
          specifiers
        });
      }
    }
  });
  return {
    file,
    heavyImports
  };
}

// src/transformer.ts
var import_fs4 = __toESM(require("fs"), 1);
var import_parser2 = require("@babel/parser");
var import_traverse2 = __toESM(require("@babel/traverse"), 1);
var import_generator = __toESM(require("@babel/generator"), 1);
var t2 = __toESM(require("@babel/types"), 1);
var traverse2 = import_traverse2.default.default ?? import_traverse2.default;
var generate = import_generator.default.default ?? import_generator.default;
function transformCode(code, heavyImports) {
  const ast = (0, import_parser2.parse)(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"]
  });
  const grouped = /* @__PURE__ */ new Map();
  for (const imp of heavyImports) {
    grouped.set(imp.source, imp.specifiers);
  }
  traverse2(ast, {
    ImportDeclaration(path3) {
      if (grouped.has(path3.node.source.value)) {
        path3.remove();
      }
    }
  });
  const body = ast.program.body;
  if (!body.some(
    (n) => t2.isImportDeclaration(n) && n.source.value === "next/dynamic"
  )) {
    body.unshift(
      t2.importDeclaration(
        [t2.importDefaultSpecifier(t2.identifier("dynamic"))],
        t2.stringLiteral("next/dynamic")
      )
    );
  }
  let lastImportIndex = -1;
  for (let i = 0; i < body.length; i++) {
    if (t2.isImportDeclaration(body[i])) {
      lastImportIndex = i;
    }
  }
  let insertIndex = lastImportIndex + 1;
  for (const [src, specs] of grouped) {
    for (const s of specs) {
      if (s.type === "named" && FORBIDDEN_NAMED_EXPORTS.includes(s.local)) {
        continue;
      }
      const declaration = t2.variableDeclaration("const", [
        t2.variableDeclarator(
          t2.identifier(s.local),
          t2.callExpression(t2.identifier("dynamic"), [
            t2.arrowFunctionExpression(
              [],
              s.type === "default" ? t2.callExpression(t2.import(), [
                t2.stringLiteral(src)
              ]) : t2.callExpression(
                t2.memberExpression(
                  t2.callExpression(t2.import(), [
                    t2.stringLiteral(src)
                  ]),
                  t2.identifier("then")
                ),
                [
                  t2.arrowFunctionExpression(
                    [t2.identifier("m")],
                    t2.memberExpression(
                      t2.identifier("m"),
                      t2.identifier(s.imported)
                    )
                  )
                ]
              )
            ),
            t2.objectExpression([
              t2.objectProperty(
                t2.identifier("ssr"),
                t2.booleanLiteral(false)
              )
            ])
          ])
        )
      ]);
      body.splice(insertIndex, 0, declaration);
      insertIndex++;
    }
  }
  return generate(ast, { retainLines: true }).code;
}
function transformFile(result, options) {
  const code = import_fs4.default.readFileSync(result.file, "utf8");
  const out = transformCode(code, result.heavyImports);
  if (options.dryRun) {
    console.log(`\u{1F9EA} DRY-RUN: ${result.file}`);
    return;
  }
  import_fs4.default.writeFileSync(result.file, out, "utf8");
  if (options.verbose) {
    console.log(`\u270F\uFE0F ${result.file}`);
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
function parseArgs(args2) {
  return {
    srcDir: getArgValue(args2, "--app", "./app"),
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
  console.log("\n\u2714 Finalizado");
}

// src/cli.ts
function printHelp() {
  console.log(`
\u{1F525} heavy-imports-fix

Uso:
  npx heavy-imports-fix [op\xE7\xF5es]

Op\xE7\xF5es:
  --src <dir>        Diret\xF3rio base (default: ./src)
  --dry-run          N\xE3o escreve arquivos
  --report-only      Apenas relat\xF3rio
  --verbose          Logs detalhados
  --help             Ajuda
`);
}
var args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}
run(args);
