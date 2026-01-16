import fs from "fs";
import path from "path";
import { hasFileRecursive } from "./utils/hasFileRecursive";

const VALID_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

export function scanFiles(dir: string): string[] {
  const result: string[] = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;

    const stat = fs.statSync(current);

    if (stat.isDirectory()) {
      if (!hasFileRecursive(current, VALID_EXTENSIONS)) return;

      const entries = fs.readdirSync(current);
      for (const entry of entries) {
        walk(path.join(current, entry));
      }
      return;
    }

    if (
      stat.isFile() &&
      VALID_EXTENSIONS.some(ext => current.endsWith(ext))
    ) {
      result.push(current);
    }
  }

  walk(dir);
  return result;
}