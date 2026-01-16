"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
function report(results) {
    const withHeavy = results.filter((r) => r.heavyImports.length > 0);
    console.log("\n📊 Relatório");
    console.log(`Arquivos analisados: ${results.length}`);
    console.log(`Arquivos com imports pesados: ${withHeavy.length}\n`);
    withHeavy.forEach((r) => {
        console.log(`📄 ${r.file}`);
        r.heavyImports.forEach((lib) => console.log(`   - ${lib}`));
    });
}
