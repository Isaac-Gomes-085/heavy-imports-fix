import { Project, SyntaxKind, SourceFile, ImportDeclaration } from "ts-morph";
import { heavyLibs, UTILITY_LIBS } from "./rules/heavyLibs";

export type HeavyImport = {
  source: string;
  isUtility: boolean;
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

// ts-morph gerencia o projeto e arquivos globalmente ou por função
const project = new Project();

function isHeavyLib(source: string) {
  return heavyLibs.some((lib) => {
    if (lib.endsWith("*")) {
      return source.startsWith(lib.replace("*", ""));
    }
    return source === lib || source.startsWith(`${lib}/`);
  });
}

export function analyzeFile(file: string): AnalysisResult {
  // Adiciona o arquivo ao projeto ts-morph para análise de tipos e AST
  const sourceFile = project.addSourceFileAtPath(file);
  const heavyImports: HeavyImport[] = [];

  // Usa os métodos de navegação do ts-morph (semelhante ao traverse)
  const importDeclarations = sourceFile.getImportDeclarations();

  for (const importDecl of importDeclarations) {
    const source = importDecl.getModuleSpecifierValue();

    if (!isHeavyLib(source)) continue;

    const isUtility = UTILITY_LIBS.some(
      (lib) => source === lib || source.startsWith(`${lib}/`)
    );

    const specifiers: HeavyImport["specifiers"] = [];

    // Lógica para extrair default e named imports usando ts-morph API
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      specifiers.push({
        local: defaultImport.getText(),
        type: "default",
      });
    }

    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      specifiers.push({
        local: namedImport.getAliasNode()?.getText() || namedImport.getName(),
        imported: namedImport.getName(),
        type: "named",
      });
    }

    if (specifiers.length) {
      heavyImports.push({
        source,
        isUtility,
        specifiers,
      });
    }
  }

  // Remove o arquivo do projeto após a análise para evitar duplicação em chamadas futuras
  project.removeSourceFile(sourceFile);

  return {
    file,
    heavyImports,
  };
}
