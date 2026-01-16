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
exports.analyzeFile = analyzeFile;
const fs_1 = __importDefault(require("fs"));
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const heavyLibs_1 = require("./rules/heavyLibs");
const guards_1 = require("./rules/guards");
function isHeavyImportSource(source) {
    return heavyLibs_1.heavyLibs.some((lib) => {
        if (!lib)
            return false;
        if (lib.endsWith("*")) {
            return source.startsWith(lib.replace("*", ""));
        }
        return source === lib || source.startsWith(`${lib}/`);
    });
}
function analyzeFile(filePath, options) {
    const code = fs_1.default.readFileSync(filePath, "utf8");
    const isClient = (0, guards_1.isClientComponent)(code);
    const ast = (0, parser_1.parse)(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
    });
    const heavyImportsMap = new Map();
    (0, traverse_1.default)(ast, {
        ImportDeclaration(path) {
            const source = path.node.source.value;
            if (!isHeavyImportSource(source))
                return;
            // ignora side-effect import: import "x";
            if (path.node.specifiers.length === 0)
                return;
            if (!heavyImportsMap.has(source)) {
                heavyImportsMap.set(source, {
                    source,
                    specifiers: [],
                });
            }
            const entry = heavyImportsMap.get(source);
            path.node.specifiers.forEach((spec) => {
                if (t.isImportSpecifier(spec)) {
                    const importedName = t.isIdentifier(spec.imported)
                        ? spec.imported.name
                        : spec.imported.value;
                    entry.specifiers.push({
                        local: spec.local.name,
                        imported: importedName,
                        type: "named",
                    });
                }
            });
        },
    });
    const heavyImports = Array.from(heavyImportsMap.values());
    const canTransform = isClient && heavyImports.length > 0;
    if (options.verbose && heavyImports.length > 0) {
        console.log(`📦 ${filePath}`);
        heavyImports.forEach((imp) => {
            console.log(`   • ${imp.source}`);
            imp.specifiers.forEach((s) => console.log(`     - ${s.type} ${s.imported} as ${s.local}`));
        });
    }
    return {
        file: filePath,
        isClient,
        heavyImports,
        canTransform,
    };
}
