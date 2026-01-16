// src/utils/ast.ts
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import fs from "fs";

export { traverse, generate };

export function readFile(file: string): string {
  return fs.readFileSync(file, "utf8");
}

export function writeFile(file: string, content: string) {
  fs.writeFileSync(file, content, "utf8");
}