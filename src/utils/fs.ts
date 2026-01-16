import fs from "fs";

export function readFile(file: string): string {
  return fs.readFileSync(file, "utf8");
}

export function writeFile(file: string, content: string) {
  fs.writeFileSync(file, content, "utf8");
}