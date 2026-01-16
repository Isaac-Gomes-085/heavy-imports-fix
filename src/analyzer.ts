import fs from "fs";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";
import { heavyLibs } from "./rules/heavyLibs";

export type HeavyImport = {
  source: string;
  specifiers: {
    local: string;
    imported?: string;
    type: "default" | "named";
  }[];
};

export type AnalysisResult = {
  file: string;
  heavyImports: HeavyImport[];
};

const traverse = (traverseModule as any).default ?? traverseModule;

function isHeavyLib(source: string) {
  return heavyLibs.some((lib) => {
    if (lib.endsWith("*")) {
      return source.startsWith(lib.replace("*", ""));
    }

    return source === lib || source.startsWith(`${lib}/`);
  });
}

export function analyzeFile(file: string): AnalysisResult {
  const code = fs.readFileSync(file, "utf8");

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const heavyImports: HeavyImport[] = [];

  traverse(ast, {
    ImportDeclaration(path: any) {
      const source = path.node.source.value;

      // AGORA SÓ ANALISA SE ESTIVER NA heavyLibs
      if (!isHeavyLib(source)) return;

      const specifiers: HeavyImport["specifiers"] = [];

      for (const spec of path.node.specifiers) {
        if (t.isImportDefaultSpecifier(spec)) {
          specifiers.push({
            local: spec.local.name,
            type: "default",
          });
        }

        if (t.isImportSpecifier(spec)) {
          specifiers.push({
            local: spec.local.name,
            imported: t.isIdentifier(spec.imported)
              ? spec.imported.name
              : spec.imported.value,
            type: "named",
          });
        }
      }

      if (specifiers.length) {
        heavyImports.push({
          source,
          specifiers,
        });
      }
    },
  });

  return {
    file,
    heavyImports,
  };
}