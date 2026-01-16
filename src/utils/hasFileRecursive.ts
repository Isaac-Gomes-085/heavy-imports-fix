import fs from "fs";
import path from "path";

export function hasFileRecursive(
  dir: string,
  extensions: string[]
): boolean {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile()) {
      if (extensions.some(ext => entry.name.endsWith(ext))) return true;
    }

    if (entry.isDirectory()) {
      if (hasFileRecursive(fullPath, extensions)) return true;
    }
  }

  return false;
}