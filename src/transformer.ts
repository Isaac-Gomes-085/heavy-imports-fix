import fs from "fs";
import { Project, VariableDeclarationKind, CallExpression, SourceFile, Node } from "ts-morph";
import type { AnalysisResult, HeavyImport } from "./analyzer";
import { FORBIDDEN_NAMED_EXPORTS, LIBS_REQUIRING_ANY, UTILITY_LIBS } from "./rules/heavyLibs";
import { LIB_SUBSTITUTIONS } from "./rules/substitutions";

// ts-morph gerencia o projeto e arquivos globalmente ou por função
const project = new Project();

// Utility function to apply all AST manipulations
const applyTransformations = (sourceFile: SourceFile, heavyImports: HeavyImport[]): void => {
  const grouped = new Map<string, HeavyImport["specifiers"]>();
  const utilityVars = new Map<string, { source: string; isDefault: boolean }>();

  for (const imp of heavyImports) {
    const existing = grouped.get(imp.source) || [];
    grouped.set(imp.source, [...existing, ...imp.specifiers]);

    const isUtil = UTILITY_LIBS.some(lib => imp.source === lib || imp.source.startsWith(`${lib}/`));
    if (isUtil) {
      imp.specifiers.forEach(s => {
        const finalSource = LIB_SUBSTITUTIONS[imp.source]?.replaceWith || imp.source;
        utilityVars.set(s.local, { source: finalSource, isDefault: s.type === "default" });
      });
    }
  }

  /**
   * 1. Remove imports originais usando ts-morph API
   */
  sourceFile.getImportDeclarations().forEach(importDecl => {
    const source = importDecl.getModuleSpecifierValue();
    const shouldRemove = grouped.has(source) || (LIB_SUBSTITUTIONS[source] && LIB_SUBSTITUTIONS[source].isUtility);
    if (shouldRemove) {
      importDecl.remove();
    }
  });

  /**
   * 2. Transforma chamadas de utilitários (ex: moment()) em await import()
   *    e marca a função pai como async.
   */
  sourceFile.forEachDescendant(node => {
    if (Node.isCallExpression(node)) { 
      const callExpression = node as CallExpression;
      const identifier = callExpression.getExpression();

      if (Node.isIdentifier(identifier) && utilityVars.has(identifier.getText())) {
        const info = utilityVars.get(identifier.getText())!;
        
        // Percorre a árvore para encontrar a função pai de forma segura
        let parentNode = callExpression.getParent();
        while (parentNode) {
            // Correção: Uso de type guard correto para aplicar setIsAsync
            if (Node.isFunctionDeclaration(parentNode) || 
                Node.isArrowFunction(parentNode) || 
                Node.isMethodDeclaration(parentNode) ||
                Node.isFunctionExpression(parentNode)) {
                parentNode.setIsAsync(true);
                break;
            }
            parentNode = parentNode.getParent();
        }

        // Substitui moment() por (await import('...')).default(...)
        // Adicionado parênteses extras para garantir prioridade de execução do await
        const replacementText = `(await import('${info.source}')).${info.isDefault ? 'default' : identifier.getText()}`;
        
        const argsText = callExpression.getArguments().map(arg => arg.getText()).join(', ');
        callExpression.replaceWithText(`${replacementText}(${argsText})`);
      }
    }
  });
  
  /**
   * 3. Garante import do next/dynamic (ts-morph API)
   */
  const hasComponents = Array.from(grouped.keys()).some(src => !UTILITY_LIBS.includes(src));
  if (hasComponents && !sourceFile.getImportDeclaration('next/dynamic')) {

    const useClientDirective = sourceFile.getStatementsWithComments().find(s => s.getText().includes("use client"));
    
    // Se existir "use client", insere o import após ele (index 1), senão no topo (index 0)
    const importIndex = useClientDirective ? 1 : 0;

    sourceFile.insertImportDeclaration(importIndex, {
      defaultImport: "dynamic",
      moduleSpecifier: "next/dynamic"
    });
  }
  
  /**
   * 4. Insere dynamic imports para componentes NO FIM DO CÓDIGO
   */

  const lastImportIndex = sourceFile.getImportDeclarations().length;
  let currentInsertIndex = lastImportIndex;

  for (const [src, specs] of grouped) {
    if (UTILITY_LIBS.includes(src)) continue;

    for (const s of specs) {
      if (s.type === "named" && (FORBIDDEN_NAMED_EXPORTS as string[]).includes(s.local)) continue;

      // 1. Define a expressão de importação
      const importExpression = s.type === "default"
        ? `import('${src}')`
        : `import('${src}').then(m => m.${s.imported})`;

      // 2. Criamos o cast para o tipo real da lib em vez de usar 'as any'
      // Isso faz o TS entender que o Bar tem props de Bar, o Tooltip tem props de Tooltip, etc.
      const originalType = s.type === "default" 
        ? `typeof import('${src}').default` 
        : `typeof import('${src}').${s.imported}`;

      // 3. Montamos o statement final com casting duplo para evitar conflitos de interface do Next dynamic
      const dynamicCallText = `dynamic(() => ${importExpression}, { ssr: false }) as unknown as ${originalType}`;
      
      sourceFile.insertVariableStatement(currentInsertIndex, {
        declarationKind: VariableDeclarationKind.Const,
        declarations: [{
          name: s.local,
          initializer: dynamicCallText
        }],
        leadingTrivia: writer => currentInsertIndex === lastImportIndex ? writer.blankLine() : writer.write("")
      });

      currentInsertIndex++;
    }
  }
};

export function transformFile(
  result: AnalysisResult,
  options: { dryRun: boolean; verbose: boolean }
) {
  const sourceFile = project.addSourceFileAtPath(result.file);
  
  applyTransformations(sourceFile, result.heavyImports);
  
  // O ts-morph formata e retorna o texto completo
  const out = sourceFile.getFullText();

  if (options.dryRun) {
    console.log(`🧪 DRY-RUN: ${result.file}`);
    project.removeSourceFile(sourceFile);
    return;
  }

  fs.writeFileSync(result.file, out, "utf8");
  project.removeSourceFile(sourceFile);

  if (options.verbose) {
    console.log(`✏️  ${result.file}`);
  }
}
