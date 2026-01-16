import fs from "fs";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generatorModule from "@babel/generator";
import * as t from "@babel/types";

import type { AnalysisResult, HeavyImport } from "./analyzer";
import { FORBIDDEN_NAMED_EXPORTS } from "./rules/heavyLibs";

const traverse =
  (traverseModule as any).default ?? traverseModule;

const generate =
  (generatorModule as any).default ?? generatorModule;

function transformCode(
  code: string,
  heavyImports: HeavyImport[]
): string {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  /**
   * Agrupa imports pesados por source
   */
  const grouped = new Map<string, HeavyImport["specifiers"]>();

  for (const imp of heavyImports) {
    grouped.set(imp.source, imp.specifiers);
  }

  /**
   * Remove imports pesados originais
   */
  traverse(ast, {
    ImportDeclaration(path: any) {
      if (grouped.has(path.node.source.value)) {
        path.remove();
      }
    },
  });

  const body = ast.program.body;

  /**
   * Garante import do next/dynamic
   */
  if (
    !body.some(
      (n) =>
        t.isImportDeclaration(n) &&
        n.source.value === "next/dynamic"
    )
  ) {
    body.unshift(
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier("dynamic"))],
        t.stringLiteral("next/dynamic")
      )
    );
  }

  /**
   * Encontra posição correta para inserir os const
   */
  let lastImportIndex = -1;

  for (let i = 0; i < body.length; i++) {
    if (t.isImportDeclaration(body[i])) {
      lastImportIndex = i;
    }
  }

  let insertIndex = lastImportIndex + 1;

  /**
   * Insere dynamic imports com segurança
   */
  for (const [src, specs] of grouped) {
    for (const s of specs) {
      // BLOQUEIA named exports problemáticos
      if (
        s.type === "named" &&
        FORBIDDEN_NAMED_EXPORTS.includes(s.local)
      ) {
        continue;
      }

      const declaration = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(s.local),
          t.callExpression(t.identifier("dynamic"), [
            t.arrowFunctionExpression(
              [],
              s.type === "default"
                ? t.callExpression(t.import(), [
                    t.stringLiteral(src),
                  ])
                : t.callExpression(
                    t.memberExpression(
                      t.callExpression(t.import(), [
                        t.stringLiteral(src),
                      ]),
                      t.identifier("then")
                    ),
                    [
                      t.arrowFunctionExpression(
                        [t.identifier("m")],
                        t.memberExpression(
                          t.identifier("m"),
                          t.identifier(s.imported!)
                        )
                      ),
                    ]
                  )
            ),
            t.objectExpression([
              t.objectProperty(
                t.identifier("ssr"),
                t.booleanLiteral(false)
              ),
            ]),
          ])
        ),
      ]);

      body.splice(insertIndex, 0, declaration);
      insertIndex++;
    }
  }

  return generate(ast, { retainLines: true }).code;
}

export function transformFile(
  result: AnalysisResult,
  options: { dryRun: boolean; verbose: boolean }
) {
  const code = fs.readFileSync(result.file, "utf8");
  const out = transformCode(code, result.heavyImports);

  if (options.dryRun) {
    console.log(`🧪 DRY-RUN: ${result.file}`);
    return;
  }

  fs.writeFileSync(result.file, out, "utf8");

  if (options.verbose) {
    console.log(`✏️ ${result.file}`);
  }
}