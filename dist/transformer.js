"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFile = transformFile;
const fs_1 = __importDefault(require("fs"));
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
const t = __importStar(require("@babel/types"));
function transformFile(result, options) {
    const { file, heavyImports, isClient } = result;
    if (!isClient || heavyImports.length === 0)
        return;
    const originalCode = fs_1.default.readFileSync(file, "utf8");
    const ast = (0, parser_1.parse)(originalCode, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
    });
    let hasDynamicImport = false;
    const importDeclarationsToRemove = [];
    // 1️⃣ Detecta se já existe next/dynamic
    (0, traverse_1.default)(ast, {
        ImportDeclaration(path) {
            if (path.node.source.value === "next/dynamic") {
                hasDynamicImport = true;
            }
        },
    });
    // 2️⃣ Remove imports pesados
    (0, traverse_1.default)(ast, {
        ImportDeclaration(path) {
            const source = path.node.source.value;
            if (heavyImports.some((h) => h.source === source) &&
                path.node.specifiers.length > 0) {
                importDeclarationsToRemove.push(path);
            }
        },
    });
    importDeclarationsToRemove.forEach((p) => p.remove());
    // 3️⃣ Gera dynamic imports agrupados
    const dynamicDeclarations = [];
    heavyImports.forEach((imp) => {
        imp.specifiers.forEach((spec) => {
            let importCall;
            // default import
            if (spec.type === "default") {
                importCall = t.arrowFunctionExpression([], t.callExpression(t.import(), [t.stringLiteral(imp.source)]));
            }
            else {
                // named import
                importCall = t.arrowFunctionExpression([], t.callExpression(t.memberExpression(t.callExpression(t.import(), [
                    t.stringLiteral(imp.source),
                ]), t.identifier("then")), [
                    t.arrowFunctionExpression([t.identifier("m")], t.memberExpression(t.identifier("m"), t.identifier(spec.imported))),
                ]));
            }
            const dynamicCall = t.callExpression(t.identifier("dynamic"), [
                importCall,
                t.objectExpression([
                    t.objectProperty(t.identifier("ssr"), t.booleanLiteral(false)),
                ]),
            ]);
            dynamicDeclarations.push(t.variableDeclaration("const", [
                t.variableDeclarator(t.identifier(spec.local), dynamicCall),
            ]));
        });
    });
    // 4️⃣ Insere import do next/dynamic se necessário
    const body = ast.program.body;
    if (!hasDynamicImport) {
        body.unshift(t.importDeclaration([t.importDefaultSpecifier(t.identifier("dynamic"))], t.stringLiteral("next/dynamic")));
    }
    // 5️⃣ Insere dynamic imports após os imports
    let insertIndex = 0;
    while (insertIndex < body.length &&
        t.isImportDeclaration(body[insertIndex])) {
        insertIndex++;
    }
    body.splice(insertIndex, 0, ...dynamicDeclarations);
    const finalCode = (0, generator_1.default)(ast, {
        retainLines: true,
    }).code;
    // 6️⃣ DRY-RUN
    if (options.dryRun) {
        console.log(`\n🧪 DRY-RUN: ${file}`);
        console.log("— Antes —");
        console.log(originalCode.slice(0, 300) + "...\n");
        console.log("— Depois —");
        console.log(finalCode.slice(0, 300) + "...\n");
        return;
    }
    fs_1.default.writeFileSync(file, finalCode, "utf8");
    console.log(`✔ Convertido: ${file}`);
}
